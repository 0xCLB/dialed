import { supabase } from '@/lib/supabase';
import type { LeaderboardRow, LeaderboardScope } from '@/types/domain';

export async function getLeaderboard(scope: LeaderboardScope): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase
    .from('leaderboard_scores')
    .select('*, profiles:user_id(username, display_name, avatar_url)')
    .eq('scope', scope)
    .order('score', { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: any, index) => ({
    userId: row.user_id,
    rank: index + 1,
    score: row.score,
    entries: row.entries_count,
    movement: row.movement_score,
    fuel: row.fuel_score,
    mind: row.mind_score,
    recovery: row.recovery_score,
    profile: {
      username: row.profiles?.username ?? null,
      displayName: row.profiles?.display_name ?? null,
      avatarUrl: row.profiles?.avatar_url ?? null,
    },
  }));
}
