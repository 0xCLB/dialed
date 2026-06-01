import { getFriendships } from '@/features/social/socialService';
import type { ProfileSummary } from '@/features/social/types';
import { supabase } from '@/lib/supabase';
import type { LeaderboardRange, LeaderboardRow } from '@/features/leaderboard/types';

type DailyScoreRow = {
  user_id: string;
  score_date: string;
  total_points: number;
  movement_points: number;
  fuel_points: number;
  mind_points: number;
  recovery_points: number;
  completed_pillars: number;
  streak_count: number;
  profiles?: ProfileRow | ProfileRow[] | null;
};

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_path: string | null;
  bio: string | null;
  city: string | null;
  privacy_default: 'private' | 'friends' | 'public';
  is_pro: boolean;
};

const PROFILE_SELECT =
  'id, username, display_name, avatar_path, bio, city, privacy_default, is_pro';

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function mapProfile(row: ProfileRow | null | undefined): ProfileSummary | null {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name ?? row.username ?? 'Dialed athlete',
    avatarPath: row.avatar_path,
    bio: row.bio,
    city: row.city,
    privacyDefault: row.privacy_default,
    isPro: row.is_pro,
  };
}

function startOfWeekKey(date: string | Date) {
  const value = typeof date === 'string' ? new Date(`${date.slice(0, 10)}T12:00:00`) : new Date(date);
  const day = value.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  value.setDate(value.getDate() + diff);
  return localDateKey(value);
}

function addDaysKey(dateKey: string, days: number) {
  const value = new Date(`${dateKey}T12:00:00`);
  value.setDate(value.getDate() + days);
  return localDateKey(value);
}

async function getLeaderboardUserIds(userId: string) {
  const friendships = await getFriendships(userId).catch(() => []);
  const friendIds = friendships
    .filter((friendship) => friendship.status === 'accepted' && friendship.otherProfile)
    .map((friendship) => friendship.otherProfile?.id)
    .filter((id): id is string => Boolean(id));

  return [userId, ...friendIds];
}

async function getDailyRowsForUsers(userIds: string[], from: string, to: string) {
  if (userIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('daily_scores')
    .select(`*, profiles:user_id(${PROFILE_SELECT})`)
    .in('user_id', userIds)
    .gte('score_date', from)
    .lte('score_date', to)
    .order('total_points', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as DailyScoreRow[];
}

export function deriveLeaderboardFromDailyScores(rows: DailyScoreRow[], currentUserId?: string) {
  const byUser = new Map<string, LeaderboardRow>();

  for (const row of rows) {
    const existing = byUser.get(row.user_id);
    const profile = mapProfile(firstRelation(row.profiles));
    const next: LeaderboardRow = existing
      ? {
          ...existing,
          points: existing.points + row.total_points,
          entries: existing.entries + 1,
          completedPillars: Math.max(existing.completedPillars, row.completed_pillars),
          streak: Math.max(existing.streak, row.streak_count),
          movement: existing.movement + row.movement_points,
          fuel: existing.fuel + row.fuel_points,
          mind: existing.mind + row.mind_points,
          recovery: existing.recovery + row.recovery_points,
          profile: existing.profile ?? profile,
        }
      : {
          userId: row.user_id,
          rank: 0,
          points: row.total_points,
          entries: row.total_points > 0 ? 1 : 0,
          completedPillars: row.completed_pillars,
          streak: row.streak_count,
          movement: row.movement_points,
          fuel: row.fuel_points,
          mind: row.mind_points,
          recovery: row.recovery_points,
          profile,
          isCurrentUser: row.user_id === currentUserId,
        };

    byUser.set(row.user_id, next);
  }

  return [...byUser.values()]
    .sort((a, b) => b.points - a.points)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export async function getDailyFriendsLeaderboard(userId: string, date: string | Date = new Date()) {
  const userIds = await getLeaderboardUserIds(userId);
  const dateKey = typeof date === 'string' ? date.slice(0, 10) : localDateKey(date);
  return deriveLeaderboardFromDailyScores(await getDailyRowsForUsers(userIds, dateKey, dateKey), userId);
}

export async function getWeeklyFriendsLeaderboard(userId: string, weekStart: string | Date = new Date()) {
  const userIds = await getLeaderboardUserIds(userId);
  const start = startOfWeekKey(weekStart);
  const end = addDaysKey(start, 6);
  return deriveLeaderboardFromDailyScores(await getDailyRowsForUsers(userIds, start, end), userId);
}

export async function getAllTimeFriendsLeaderboard(userId: string) {
  const userIds = await getLeaderboardUserIds(userId);
  const end = localDateKey();
  const start = addDaysKey(end, -90);
  return deriveLeaderboardFromDailyScores(await getDailyRowsForUsers(userIds, start, end), userId);
}

export async function getMyRank(userId: string, range: LeaderboardRange) {
  const rows =
    range === 'daily'
      ? await getDailyFriendsLeaderboard(userId)
      : range === 'weekly'
        ? await getWeeklyFriendsLeaderboard(userId)
        : await getAllTimeFriendsLeaderboard(userId);

  return rows.find((row) => row.userId === userId) ?? null;
}

export async function getLeaderboard(range: LeaderboardRange, userId: string) {
  if (range === 'daily') return getDailyFriendsLeaderboard(userId);
  if (range === 'weekly') return getWeeklyFriendsLeaderboard(userId);
  return getAllTimeFriendsLeaderboard(userId);
}
