import { supabase } from '@/lib/supabase';
import { env } from '@/lib/env';
import type { Entry, EntrySource, HealthMetricSnapshot, WellnessPillar } from '@/types/domain';

export type ScoreEntryPayload = {
  source: EntrySource;
  pillar: WellnessPillar;
  actionType: string;
  title: string;
  caption?: string | null;
  proofPath?: string | null;
  healthSnapshot?: HealthMetricSnapshot | null;
  location?: Record<string, unknown> | null;
  occurredAt?: string;
  clientMetadata?: Record<string, unknown>;
};

export async function scoreEntry(payload: ScoreEntryPayload) {
  if (env.aiEdgeFunctionUrl) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('A Supabase session is required to score entries.');
    }

    const response = await fetch(env.aiEdgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        apikey: env.supabaseAnonKey,
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as { entry?: Entry; error?: string };
    if (!response.ok) {
      throw new Error(data.error ?? 'Scoring service failed.');
    }
    if (!data.entry) {
      throw new Error('Scoring service did not return an entry.');
    }

    return data.entry;
  }

  const { data, error } = await supabase.functions.invoke<{ entry: Entry }>('score-entry', {
    body: payload,
  });

  if (error) {
    throw error;
  }

  if (!data?.entry) {
    throw new Error('Scoring service did not return an entry.');
  }

  return data.entry;
}

export function suggestClientScore({
  pillar,
  actionType,
}: {
  pillar: WellnessPillar;
  actionType: string;
}) {
  const premiumActions = ['gym', 'run', 'sleep', 'healthy_meal', 'meditation', 'deep_work'];
  const base = premiumActions.includes(actionType) ? 45 : 25;
  const pillarWeight = pillar === 'movement' || pillar === 'recovery' ? 1.1 : 1;

  return Math.round(base * pillarWeight);
}
