import { supabase } from '@/lib/supabase';
import type {
  ProofEarnReason,
  ProofSpendCheck,
  ProofTier,
  ProofTransaction,
  ProofTransactionType,
  ProofWallet,
  ProofWalletSource,
} from '@/features/proofs/types';

export const RANKED_PROOF_CAPS: Record<ProofTier, number> = {
  free: 5,
  pro: 10,
};

type ProofWalletRow = {
  user_id: string;
  proof_date: string;
  base_proofs: number;
  bonus_proofs: number;
  used_proofs: number;
  remaining_proofs: number | null;
  tier: ProofTier;
  updated_at: string;
};

type ProofTransactionRow = {
  id: string;
  user_id: string;
  proof_date: string;
  entry_id: string | null;
  transaction_type: ProofTransactionType;
  amount: number;
  reason: string;
  metadata: unknown;
  created_at: string;
};

type ProofWalletOptions = {
  isPro?: boolean;
};

type EarnBonusProofOptions = {
  proofDate?: string | Date;
  metadata?: Record<string, unknown>;
};

export class ProofServiceError extends Error {
  code: 'setup_required' | 'out_of_proofs' | 'auth' | 'unknown';

  constructor(code: ProofServiceError['code'], message: string) {
    super(message);
    this.name = 'ProofServiceError';
    this.code = code;
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateKey(value?: string | Date) {
  if (!value) return localDateKey();
  return typeof value === 'string' ? value.slice(0, 10) : localDateKey(value);
}

function firstRow<T>(data: T | T[] | null): T | null {
  return Array.isArray(data) ? data[0] ?? null : data;
}

function mapWallet(row: ProofWalletRow, source: ProofWalletSource = 'server'): ProofWallet {
  const remaining = row.remaining_proofs ?? row.base_proofs + row.bonus_proofs - row.used_proofs;
  return {
    userId: row.user_id,
    proofDate: row.proof_date,
    baseProofs: Number(row.base_proofs ?? 0),
    bonusProofs: Number(row.bonus_proofs ?? 0),
    usedProofs: Number(row.used_proofs ?? 0),
    remainingProofs: Math.max(Number(remaining ?? 0), 0),
    tier: row.tier ?? 'free',
    updatedAt: row.updated_at,
    source,
  };
}

function mapTransaction(row: ProofTransactionRow): ProofTransaction {
  return {
    id: row.id,
    userId: row.user_id,
    proofDate: row.proof_date,
    entryId: row.entry_id,
    transactionType: row.transaction_type,
    amount: Number(row.amount ?? 0),
    reason: row.reason,
    metadata: asRecord(row.metadata),
    createdAt: row.created_at,
  };
}

function setupWallet(userId: string, options?: ProofWalletOptions): ProofWallet {
  const baseProofs = options?.isPro ? 20 : 5;
  return {
    userId,
    proofDate: localDateKey(),
    baseProofs,
    bonusProofs: 0,
    usedProofs: 0,
    remainingProofs: 0,
    tier: options?.isPro ? 'pro' : 'free',
    updatedAt: new Date().toISOString(),
    source: 'setup_required',
    setupRequired: true,
  };
}

function isSetupMissingError(error: unknown) {
  const message =
    typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: unknown }).message)
      : String(error ?? '');
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';
  const lower = message.toLowerCase();

  return (
    code === 'PGRST202' ||
    code === 'PGRST205' ||
    lower.includes('could not find the table') ||
    lower.includes('could not find the function') ||
    lower.includes('proof_wallets') ||
    lower.includes('proof_transactions') ||
    lower.includes('does not exist')
  );
}

function isOutOfProofsError(error: unknown) {
  const message =
    typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: unknown }).message)
      : String(error ?? '');
  return message.toLowerCase().includes('no daily proofs remaining');
}

async function getAuthenticatedUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw new ProofServiceError('auth', error.message);
  }
  if (!data.user) {
    throw new ProofServiceError('auth', 'Sign in before using Daily Proofs.');
  }
  return data.user.id;
}

async function assertOwnUser(userId: string) {
  const authUserId = await getAuthenticatedUserId();
  if (authUserId !== userId) {
    throw new ProofServiceError('auth', 'Proof wallet user must match the signed-in user.');
  }
}

export async function initializeTodayProofWallet(
  userId: string,
  options?: ProofWalletOptions,
): Promise<ProofWallet> {
  await assertOwnUser(userId);

  const { data, error } = await supabase.rpc('initialize_today_proof_wallet', {
    p_proof_date: localDateKey(),
  });

  if (error) {
    if (isSetupMissingError(error)) {
      return setupWallet(userId, options);
    }
    throw error;
  }

  const row = firstRow(data as ProofWalletRow | ProofWalletRow[] | null);
  return row ? mapWallet(row) : setupWallet(userId, options);
}

export async function getTodayProofWallet(
  userId: string,
  options?: ProofWalletOptions,
): Promise<ProofWallet> {
  await assertOwnUser(userId);
  const proofDate = localDateKey();

  const { data, error } = await supabase
    .from('proof_wallets')
    .select('*')
    .eq('user_id', userId)
    .eq('proof_date', proofDate)
    .maybeSingle();

  if (error) {
    if (isSetupMissingError(error)) {
      return setupWallet(userId, options);
    }
    throw error;
  }

  if (!data) {
    return initializeTodayProofWallet(userId, options);
  }

  return mapWallet(data as ProofWalletRow);
}

export async function canSpendProof(
  userId: string,
  options?: ProofWalletOptions,
): Promise<ProofSpendCheck> {
  const wallet = await getTodayProofWallet(userId, options);

  if (wallet.setupRequired) {
    return {
      canSpend: false,
      wallet,
      reason: 'Daily Proof tables/functions are not installed in Supabase yet.',
    };
  }

  if (wallet.remainingProofs < 1) {
    return {
      canSpend: false,
      wallet,
      reason: "You're out of Daily Proofs.",
    };
  }

  return { canSpend: true, wallet };
}

export async function spendProofForEntry(entryId: string): Promise<ProofWallet> {
  await getAuthenticatedUserId();

  const { data, error } = await supabase.rpc('spend_proof_for_entry', {
    p_entry_id: entryId,
  });

  if (error) {
    if (isSetupMissingError(error)) {
      throw new ProofServiceError(
        'setup_required',
        'Daily Proof tables/functions are not installed in Supabase yet.',
      );
    }
    if (isOutOfProofsError(error)) {
      throw new ProofServiceError('out_of_proofs', "You're out of Daily Proofs.");
    }
    throw error;
  }

  const row = firstRow(data as ProofWalletRow | ProofWalletRow[] | null);
  if (!row) {
    throw new ProofServiceError('unknown', 'Daily Proof spend returned no wallet.');
  }

  return mapWallet(row);
}

export async function earnBonusProof(
  reason: ProofEarnReason,
  options: EarnBonusProofOptions = {},
): Promise<ProofWallet | null> {
  await getAuthenticatedUserId();

  const { data, error } = await supabase.rpc('earn_bonus_proof', {
    p_reason: reason,
    p_proof_date: dateKey(options.proofDate),
    p_metadata: options.metadata ?? {},
  });

  if (error) {
    if (isSetupMissingError(error)) {
      return null;
    }
    throw error;
  }

  const row = firstRow(data as ProofWalletRow | ProofWalletRow[] | null);
  return row ? mapWallet(row) : null;
}

export async function refundProof(entryId: string, reason = 'entry_refund') {
  await getAuthenticatedUserId();

  const { data, error } = await supabase.rpc('refund_proof_for_entry', {
    p_entry_id: entryId,
    p_reason: reason,
  });

  if (error) {
    if (isSetupMissingError(error)) {
      return null;
    }
    throw error;
  }

  const row = firstRow(data as ProofWalletRow | ProofWalletRow[] | null);
  return row ? mapWallet(row) : null;
}

export async function getProofTransactions(userId: string, date: string | Date = new Date()) {
  await assertOwnUser(userId);

  const { data, error } = await supabase
    .from('proof_transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('proof_date', dateKey(date))
    .order('created_at', { ascending: false });

  if (error) {
    if (isSetupMissingError(error)) {
      return [];
    }
    throw error;
  }

  return ((data ?? []) as ProofTransactionRow[]).map(mapTransaction);
}

export function nextDateKey(date = new Date()) {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  return localDateKey(next);
}

export function isProofSetupRequired(wallet: ProofWallet | null | undefined) {
  return Boolean(wallet?.setupRequired || wallet?.source === 'setup_required');
}

export function getRankedProofCap(tier: ProofTier) {
  return RANKED_PROOF_CAPS[tier];
}
