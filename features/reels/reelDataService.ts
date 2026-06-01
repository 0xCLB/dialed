import { getEntriesForDate } from '@/features/entries/entryService';
import { getDigestForDate } from '@/features/digest/digestService';
import type { EntryWithScore, WellnessPillar } from '@/features/entries/types';
import { getDailyFriendsLeaderboard } from '@/features/leaderboard/leaderboardService';
import type { LeaderboardRow } from '@/features/leaderboard/types';
import {
  getDailyScore,
  getUserStreak,
  recomputeLocalDaySummary,
} from '@/features/progress/progressService';
import type { DailyScore, DaySummary } from '@/features/progress/types';
import type { ProfileSummary } from '@/features/social/types';
import { PILLARS, PILLAR_ORDER } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import type { ReelData, ReelSlide } from '@/features/reels/types';

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

function normalizeDate(date: string | Date) {
  return typeof date === 'string' ? date.slice(0, 10) : localDateKey(date);
}

function readableDate(dateKey: string) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function readableTime(value: string) {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
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
  if (!data.user) throw new Error('You must be signed in to generate a reel.');
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

async function getDigestQuote(date: string) {
  const digest = await getDigestForDate(date).catch(() => null);
  return digest?.shareQuote ?? digest?.body ?? null;
}

function titleCaseActivity(value?: string | null) {
  return (value ?? 'Proof logged')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function entryPillar(entry: EntryWithScore): WellnessPillar | null {
  return entry.score?.wellnessPillar ?? entry.wellnessPillar ?? null;
}

function scoreLabel(points?: number | null) {
  return points ? `+${points} Dialed Points` : 'Scoring in progress';
}

function missingPillarLine(summary: DaySummary) {
  const missing = PILLAR_ORDER.filter((pillar) => !summary.completedPillars.includes(pillar));
  if (missing.length === 0) {
    return 'All four pillars answered. Fully Dialed.';
  }

  if (missing.includes('recovery')) {
    return 'Recovery ghosted. Tomorrow has entered the chat.';
  }

  return `${PILLARS[missing[0]].label} is untouched. Easy points are still on the board.`;
}

export function buildEntrySlides(entries: EntryWithScore[]): ReelSlide[] {
  if (entries.length === 0) {
    return [
      {
        id: 'entry-empty',
        type: 'entry',
        date: localDateKey(),
        title: 'The reel starts with the first proof',
        subtitle: 'Log a walk, water, lift, stretch, or quiet win.',
        kicker: 'No proofs yet',
        points: null,
        mediaUrl: null,
        entry: null,
        pillar: null,
      },
    ];
  }

  return entries.map((entry, index) => {
    const pillar = entryPillar(entry);
    const points = entry.score?.points ?? null;
    const pillarLabel = pillar ? PILLARS[pillar].label : 'Wellness';

    return {
      id: `entry-${entry.id}`,
      type: 'entry',
      date: entry.occurredAt.slice(0, 10),
      title: scoreLabel(points),
      subtitle: entry.score?.aiSubtext ?? entry.caption ?? 'Proof > promises',
      kicker: `${pillarLabel} proof logged`,
      points,
      mediaUrl: entry.media[0]?.signedUrl ?? null,
      entry,
      pillar,
      timestamp: readableTime(entry.occurredAt),
      aiSubtext: entry.score?.aiSubtext ?? null,
      metadata: {
        activity: titleCaseActivity(entry.activityTag),
        slide_position: index + 1,
        pending: !entry.score,
      },
    };
  });
}

export function buildPillarSummarySlide(
  dailyScore: DailyScore | null,
  entries: EntryWithScore[],
): ReelSlide {
  const date = dailyScore?.scoreDate ?? entries[0]?.occurredAt.slice(0, 10) ?? localDateKey();
  const summary = recomputeLocalDaySummary(entries, undefined, date, dailyScore);
  const missing = PILLAR_ORDER.filter((pillar) => !summary.completedPillars.includes(pillar));

  return {
    id: `pillar-summary-${date}`,
    type: 'pillar_summary',
    date,
    title: `${summary.completedPillars.length}/4 pillars complete`,
    subtitle: missingPillarLine(summary),
    kicker: summary.fullyDialed ? 'Fully Dialed Day' : 'Pillar check',
    points: summary.totalPoints,
    pillarProgress: summary.pillarProgress,
    completedPillars: summary.completedPillars,
    missingPillars: missing,
  };
}

export async function buildLeaderboardSlide(date: string | Date): Promise<ReelSlide> {
  const dateKey = normalizeDate(date);
  const userId = await getAuthenticatedUserId();
  const rows = await getDailyFriendsLeaderboard(userId, dateKey).catch(() => []);
  const myRow = rows.find((row) => row.userId === userId) ?? null;
  const next = myRow ? rows.find((row) => row.rank === myRow.rank - 1) : null;

  return {
    id: `leaderboard-${dateKey}`,
    type: 'leaderboard',
    date: dateKey,
    title: myRow ? `#${myRow.rank} among friends` : 'Friends leaderboard',
    subtitle:
      myRow && next
        ? `${Math.max(0, next.points - myRow.points)} points behind ${next.profile?.displayName ?? 'the next spot'}.`
        : 'Add friends. Make the scoreboard personal.',
    kicker: 'Competition check',
    points: myRow?.points ?? 0,
    leaderboardRow: myRow,
    leaderboardRows: rows.slice(0, 5),
  };
}

export function buildOutroSlide(profile: ProfileSummary | null): ReelSlide {
  return {
    id: `outro-${profile?.id ?? 'me'}`,
    type: 'outro',
    date: localDateKey(),
    title: 'Get Dialed',
    subtitle: 'Proof > promises',
    kicker: profile?.username ? `@${profile.username}` : 'Dialed Self',
    profile,
    metadata: {
      invite_deep_link_placeholder: 'dialedself://invite/INVITE-CODE',
      premium_hooks: ['weekly_reels', 'premium_templates', 'remove_watermark', 'music_templates'],
    },
  };
}

export async function getReelAssetsForDate(date: string | Date) {
  const dateKey = normalizeDate(date);
  const userId = await getAuthenticatedUserId();
  const entries = await getEntriesForDate(userId, dateKey).catch(() => []);

  return entries
    .flatMap((entry) => entry.media.map((media) => media.signedUrl))
    .filter((url): url is string => Boolean(url));
}

export async function buildDailyReelData(date: string | Date = new Date()): Promise<ReelData> {
  const dateKey = normalizeDate(date);
  const { userId, profile } = await getMyProfile();
  const [entries, dailyScore, streak, digestQuote, leaderboardSlide] = await Promise.all([
    getEntriesForDate(userId, dateKey).catch(() => []),
    getDailyScore(userId, dateKey).catch(() => null),
    getUserStreak(userId).catch(() => null),
    getDigestQuote(dateKey),
    buildLeaderboardSlide(dateKey).catch(() => null),
  ]);
  const summary = recomputeLocalDaySummary(entries, undefined, dateKey, dailyScore);
  const entrySlides = buildEntrySlides(entries).map((slide) => ({ ...slide, date: dateKey }));
  const pillarSummarySlide = buildPillarSummarySlide(dailyScore, entries);
  const displayName = profile?.displayName ?? 'Dialed athlete';
  const mediaUrls = entrySlides
    .map((slide) => slide.mediaUrl)
    .filter((url): url is string => Boolean(url));
  const introSlide: ReelSlide = {
    id: `intro-${dateKey}`,
    type: 'intro',
    date: dateKey,
    title: `${displayName}'s Dialed Day`,
    subtitle: 'Proof stacked. Points earned.',
    kicker: readableDate(dateKey),
    points: summary.totalPoints,
    pillarProgress: summary.pillarProgress,
    completedPillars: summary.completedPillars,
    profile,
    streak,
  };
  const digestSlide: ReelSlide | null = digestQuote
    ? {
        id: `digest-${dateKey}`,
        type: 'digest',
        date: dateKey,
        title: 'Today in proof',
        subtitle: digestQuote,
        kicker: 'TwainGPT digest',
        profile,
      }
    : null;
  const outroSlide = {
    ...buildOutroSlide(profile),
    date: dateKey,
  };
  const slides = [
    introSlide,
    ...entrySlides,
    pillarSummarySlide,
    ...(leaderboardSlide ? [{ ...leaderboardSlide, streak }] : []),
    ...(digestSlide ? [digestSlide] : []),
    outroSlide,
  ];
  const template = summary.fullyDialed
    ? 'fully_dialed'
    : profile?.isPro && mediaUrls.length > 0
      ? 'athlete'
      : mediaUrls.length > 0
        ? 'pastel'
        : 'clean';
  const leaderboardRows = leaderboardSlide?.leaderboardRows ?? [];
  const leaderboardRow = leaderboardSlide?.leaderboardRow ?? null;

  return {
    id: `daily-${dateKey}-${userId}`,
    type: 'daily',
    date: dateKey,
    template,
    profile,
    username: profile?.username,
    displayName,
    totalPoints: summary.totalPoints,
    dailyScore,
    daySummary: summary,
    entries,
    streak,
    leaderboard: {
      row: leaderboardRow,
      rows: leaderboardRows,
    },
    digestQuote,
    mediaUrls,
    slides,
    watermark: true,
    deepLink: `dialedself://timeline/${dateKey}`,
    inviteCode: 'INVITE-CODE',
    metadata: {
      generated_locally: true,
      export_kind: 'cover_image',
      pro_placeholders: ['weekly_reels', 'premium_templates', 'remove_watermark', 'music_templates'],
    },
  };
}
