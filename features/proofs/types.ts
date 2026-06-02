export type ProofTier = 'free' | 'pro';

export type ProofTransactionType = 'spend' | 'earn' | 'refund' | 'reset';

export type ProofEarnReason =
  | 'share_card'
  | 'fully_dialed_tomorrow'
  | 'three_day_streak_tomorrow'
  | 'invite_signup';

export type ProofWalletSource = 'server' | 'setup_required';

export type ProofWallet = {
  userId: string;
  proofDate: string;
  baseProofs: number;
  bonusProofs: number;
  usedProofs: number;
  remainingProofs: number;
  tier: ProofTier;
  updatedAt: string;
  source: ProofWalletSource;
  setupRequired?: boolean;
};

export type ProofTransaction = {
  id: string;
  userId: string;
  proofDate: string;
  entryId: string | null;
  transactionType: ProofTransactionType;
  amount: number;
  reason: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type ProofSpendCheck = {
  canSpend: boolean;
  wallet: ProofWallet;
  reason?: string;
};
