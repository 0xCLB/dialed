import { supabase } from '@/lib/supabase';
import type { Challenge, WellnessPillar } from '@/types/domain';

function mapChallenge(row: any): Challenge {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description,
    pillar: row.pillar,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    isPrivate: row.is_private,
    entryGoal: row.entry_goal,
    createdAt: row.created_at,
  };
}

export async function listChallenges() {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .order('starts_at', { ascending: false })
    .limit(30);

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapChallenge);
}

export async function createChallenge(input: {
  ownerId: string;
  title: string;
  description?: string;
  pillar: WellnessPillar | 'all';
  entryGoal: number;
  startsAt: string;
  endsAt: string;
  isPrivate?: boolean;
}) {
  const { error } = await supabase.from('challenges').insert({
    owner_id: input.ownerId,
    title: input.title,
    description: input.description ?? null,
    pillar: input.pillar,
    entry_goal: input.entryGoal,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    is_private: input.isPrivate ?? false,
  });

  if (error) {
    throw error;
  }
}
