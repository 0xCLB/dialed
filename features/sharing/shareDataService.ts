import { getEntryWithScore, getEntriesForDate } from '@/features/entries/entryService';
import { generateDigestForDate, getDigestForDate } from '@/features/digest/digestService';
import {
  getAllTimeFriendsLeaderboard,
  getDailyFriendsLeaderboard,
  getMyRank,
  getWeeklyFriendsLeaderboard,
} from '@/features/leaderboard/leaderboardService';
import type { LeaderboardRange } from '@/features/leaderboard/types';
import {
  getDailyScore,
  getUserStreak,
  recomputeLocalDaySummary,
} from '@/features/progress/progressService';
import { getEntryDisplayScore } from '@/features/scoring/basicScoring';
import type { WellnessPillar } from '@/features/progress/types';
import { getFriendProfile } from '@/features/social/socialService';
import type { ProfileSummary } from '@/features/social/types';
import { PILLARS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import type { ShareCardData } from '@/features/sharing/types';

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

async function getAuthenticatedUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('You must be signed in to share.');
  return data.user.id;
}

async function getMyProfile() {
  const userId = await getAuthenticatedUserId();
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return { userId, profile: mapProfile(data as ProfileRow | null) };
}

function entryTitle(activityTag?: string | null) {
  return activityTag?.replace(/[_-]+/g, ' ') ?? 'Proof logged';
}

function defaultDeepLink(type: string, id?: string) {
  return `dialedself://${type}${id ? `/${id}` : ''}`;
}

export async function buildEntryShareData(entryId: string): Promise<ShareCardData> {
  const [{ profile }, entry] = await Promise.all([getMyProfile(), getEntryWithScore(entryId)]);
  const pillar = entry.score?.wellnessPillar ?? entry.wellnessPillar ?? 'mind';
  const displayScore = getEntryDisplayScore(entry);
  const points = displayScore.points ?? 0;

  return {
    type: 'entry',
    template: entry.entryType === 'photo' ? 'athlete' : 'clean',
    kicker: `${PILLARS[pillar].label} proof logged`,
    title: displayScore.basic ? `Basic +${points} Dialed Points` : `+${points} Dialed Points`,
    subtitle: entry.score?.aiSubtext ?? entry.caption ?? displayScore.detail ?? 'Proof > promises',
    points,
    username: profile?.username,
    profile,
    entry,
    mediaUrl: entry.media[0]?.signedUrl ?? null,
    pillar,
    deepLink: defaultDeepLink('entry', entry.id),
  };
}

export async function buildDailyScoreShareData(date: string | Date = new Date()): Promise<ShareCardData> {
  const { userId, profile } = await getMyProfile();
  const dateKey = typeof date === 'string' ? date.slice(0, 10) : localDateKey(date);
  const [entries, dailyScore] = await Promise.all([
    getEntriesForDate(userId, dateKey).catch(() => []),
    getDailyScore(userId, dateKey).catch(() => null),
  ]);
  const summary = recomputeLocalDaySummary(entries, undefined, dateKey, dailyScore);
  const strongest = [...summary.pillarProgress].sort((a, b) => b.points - a.points)[0];
  const weakest = [...summary.pillarProgress].sort((a, b) => a.points - b.points)[0];

  return {
    type: 'daily_score',
    template: summary.fullyDialed ? 'fully_dialed' : 'pastel',
    kicker: `${summary.completedPillars.length}/4 pillars complete`,
    title: `${profile?.displayName ?? 'Dialed athlete'} got ${summary.totalPoints} Dialed Points today`,
    subtitle:
      strongest && weakest
        ? `${PILLARS[strongest.pillar].label} carried. ${PILLARS[weakest.pillar].label} ${weakest.points > 0 ? 'showed up.' : 'ghosted.'}`
        : 'Proof > promises',
    points: summary.totalPoints,
    username: profile?.username,
    profile,
    daySummary: summary,
    completedPillars: summary.completedPillars,
    deepLink: defaultDeepLink('timeline', dateKey),
  };
}

export async function buildFullyDialedShareData(date: string | Date = new Date()) {
  const data = await buildDailyScoreShareData(date);
  return {
    ...data,
    type: 'fully_dialed' as const,
    template: 'fully_dialed' as const,
    kicker: 'Movement • Fuel • Mind • Recovery',
    title: 'Fully Dialed Day',
    subtitle: 'Rare day. No notes.',
  };
}

export async function buildStreakShareData(): Promise<ShareCardData> {
  const { userId, profile } = await getMyProfile();
  const streak = await getUserStreak(userId).catch(() => null);
  const current = streak?.currentStreak ?? 0;

  return {
    type: 'streak',
    template: current >= 7 ? 'dark' : 'clean',
    kicker: 'Consistency is getting suspicious.',
    title: `${current}-Day Dialed Streak`,
    subtitle: current > 0 ? 'Proof keeps stacking.' : 'The next streak starts today.',
    points: current,
    username: profile?.username,
    profile,
    streak,
    deepLink: defaultDeepLink('profile', userId),
  };
}

export async function buildLeaderboardShareData(range: LeaderboardRange = 'daily'): Promise<ShareCardData> {
  const { userId, profile } = await getMyProfile();
  const rows =
    range === 'daily'
      ? await getDailyFriendsLeaderboard(userId).catch(() => [])
      : range === 'weekly'
        ? await getWeeklyFriendsLeaderboard(userId).catch(() => [])
        : await getAllTimeFriendsLeaderboard(userId).catch(() => []);
  const myRow = rows.find((row) => row.userId === userId) ?? (await getMyRank(userId, range).catch(() => null));
  const next = myRow ? rows.find((row) => row.rank === myRow.rank - 1) : null;

  return {
    type: 'leaderboard',
    template: 'leaderboard',
    kicker: `${range.replace('_', ' ')} friends leaderboard`,
    title: myRow ? `#${myRow.rank} among friends today` : 'Friends leaderboard',
    subtitle:
      myRow && next
        ? `${Math.max(0, next.points - myRow.points)} points behind ${next.profile?.displayName ?? 'the next spot'}. War is near.`
        : 'Add friends. Make it interesting.',
    points: myRow?.points ?? 0,
    username: profile?.username,
    profile,
    leaderboard: { range, row: myRow, rows },
    deepLink: defaultDeepLink('leaderboard', range),
  };
}

export async function buildFriendCompareShareData(friendId: string, date: string | Date = new Date()): Promise<ShareCardData> {
  const { userId, profile } = await getMyProfile();
  const dateKey = typeof date === 'string' ? date.slice(0, 10) : localDateKey(date);
  const [myEntries, myScore, friend] = await Promise.all([
    getEntriesForDate(userId, dateKey).catch(() => []),
    getDailyScore(userId, dateKey).catch(() => null),
    getFriendProfile(friendId),
  ]);
  const mine = recomputeLocalDaySummary(myEntries, undefined, dateKey, myScore);
  const friendSummary = friend.todaySummary;
  const winners = mine.pillarProgress.reduce<Partial<Record<WellnessPillar, string>>>((acc, pillar) => {
    const theirs = friendSummary.pillarProgress.find((item) => item.pillar === pillar.pillar);
    if (!theirs || pillar.points === theirs.points) {
      acc[pillar.pillar] = 'nobody, apparently';
    } else {
      acc[pillar.pillar] =
        pillar.points > theirs.points ? profile?.displayName ?? 'You' : friend.profile.displayName;
    }
    return acc;
  }, {});

  return {
    type: 'friend_compare',
    template: 'leaderboard',
    kicker: 'Friend comparison',
    title: `${profile?.displayName ?? 'You'} vs ${friend.profile.displayName}`,
    subtitle: `Movement: ${winners.movement}. Fuel: ${winners.fuel}. Recovery: ${winners.recovery}.`,
    username: profile?.username,
    profile,
    friendCompare: {
      friend: friend.profile,
      date: dateKey,
      myPoints: mine.totalPoints,
      friendPoints: friendSummary.totalPoints,
      winners,
    },
    deepLink: defaultDeepLink('friends', friendId),
  };
}

export async function buildDigestShareData(date: string | Date = new Date()): Promise<ShareCardData> {
  const dateKey = typeof date === 'string' ? date.slice(0, 10) : localDateKey(date);
  const digest = (await getDigestForDate(dateKey)) ?? (await generateDigestForDate(dateKey));
  const profile = digest.scoreSummary.profile;

  return {
    type: 'digest',
    template: 'dark',
    kicker: 'Daily Recap',
    title: digest.title,
    subtitle: digest.shareQuote,
    points: digest.scoreSummary.totalPoints,
    username: profile?.username,
    profile,
    digestQuote: digest.shareQuote,
    daySummary: digest.scoreSummary.daySummary,
    deepLink: defaultDeepLink('digest', dateKey),
  };
}
