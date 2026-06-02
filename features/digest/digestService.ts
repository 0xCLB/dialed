import { getEntriesForDate } from '@/features/entries/entryService';
import type { EntryWithScore, WellnessPillar } from '@/features/entries/types';
import { getDailyFriendsLeaderboard } from '@/features/leaderboard/leaderboardService';
import {
  getDailyScore,
  getUserStreak,
  recomputeLocalDaySummary,
} from '@/features/progress/progressService';
import type { PillarProgress } from '@/features/progress/types';
import type { ProfileSummary } from '@/features/social/types';
import { PILLARS, PILLAR_ORDER } from '@/lib/constants';
import { track } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';
import type {
  DailyDigest,
  DigestInputSummary,
  DigestInsight,
  DigestInsightKey,
  DigestRecommendation,
  DigestTone,
} from '@/features/digest/types';

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

type DailyDigestRow = {
  id: string;
  user_id: string;
  digest_date: string;
  title: string;
  body: string;
  tone: DigestTone;
  insights: Record<string, unknown>;
  score_summary: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type EdgeDigestResponse = {
  title?: string;
  body?: string;
  tone?: DigestTone;
  insights?: Record<string, unknown>;
  score_summary?: Record<string, unknown>;
  error?: string;
};

const PROFILE_SELECT =
  'id, username, display_name, avatar_path, bio, city, privacy_default, is_pro';

const ACTION_ROUTES: Record<WellnessPillar, string> = {
  movement: '/(tabs)/capture',
  fuel: '/(tabs)/check-in',
  mind: '/(tabs)/check-in',
  recovery: '/(tabs)/check-in',
};

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeDate(date: string | Date) {
  return typeof date === 'string' ? date.slice(0, 10) : localDateKey(date);
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
  if (!data.user) throw new Error('You must be signed in to view your Daily Recap.');
  return data.user.id;
}

async function getMyProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return mapProfile(data as ProfileRow | null);
}

function displayActivity(entry: EntryWithScore | null) {
  return (entry?.score?.normalizedActivity ?? entry?.activityTag ?? 'proof logged')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function pillarLabel(pillar?: WellnessPillar | null) {
  return pillar ? PILLARS[pillar].label : 'Proof';
}

function scorePercent(totalPoints: number, completedPillars: number) {
  const pointsComponent = Math.min(totalPoints, 120) / 120;
  const pillarComponent = completedPillars / 4;
  return Math.round((pointsComponent * 0.45 + pillarComponent * 0.55) * 100);
}

function pickStrongest(progress: PillarProgress[]) {
  return [...progress].sort((a, b) => b.points - a.points)[0] ?? null;
}

function pickWeakest(progress: PillarProgress[], missing: WellnessPillar[]) {
  if (missing.length > 0) {
    return progress.find((pillar) => pillar.pillar === missing[0]) ?? null;
  }
  return [...progress].sort((a, b) => a.points - b.points)[0] ?? null;
}

function buildRecommendation(input: DigestInputSummary): DigestRecommendation {
  const target = input.missingPillars[0] ?? input.weakestPillar?.pillar ?? 'recovery';
  const copy: Record<WellnessPillar, { title: string; body: string; actionLabel: string }> = {
    movement: {
      title: 'Put points on your feet',
      body: 'A walk, lift, ride, or sport proof gives tomorrow a backbone.',
      actionLabel: 'Capture movement',
    },
    fuel: {
      title: 'Make Fuel less mysterious',
      body: 'Water, protein, or a clean meal proof is enough to wake the pillar up.',
      actionLabel: 'Log fuel',
    },
    mind: {
      title: 'Give Mind ten clean minutes',
      body: 'Read, journal, meditate, or log deep work. Small proof, real signal.',
      actionLabel: 'Log mind',
    },
    recovery: {
      title: 'Let Recovery have the microphone',
      body: 'Stretch, mobility, sauna, breathwork, or sleep prep. The scoreboard accepts quiet wins.',
      actionLabel: 'Log recovery',
    },
  };

  return {
    ...copy[target],
    pillar: target,
    route: ACTION_ROUTES[target],
  };
}

function buildInsight(
  key: DigestInsightKey,
  label: string,
  body: string,
  value?: string | number | null,
  pillar?: WellnessPillar | null,
): DigestInsight {
  return { key, label, body, value, pillar };
}

function rawText(raw: Record<string, unknown> | undefined, key: string) {
  const value = raw?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function rawStringArray(raw: Record<string, unknown> | undefined, key: string) {
  const value = raw?.[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function buildInsightsFromInput(
  input: DigestInputSummary,
  raw?: Record<string, unknown>,
): DigestInsight[] {
  const strongest = input.strongestPillar?.pillar ?? null;
  const weakest = input.weakestPillar?.pillar ?? null;
  const bestEntry = input.bestEntry;
  const friendContext =
    input.leaderboardRow && input.leaderboardRows.length > 1
      ? `You sit #${input.leaderboardRow.rank} with ${input.leaderboardRow.points} points.`
      : 'Leaderboard context is thin today. Add a friend and make it interesting.';
  const bestEntryCopy = bestEntry
    ? `${displayActivity(bestEntry)} led the day with ${bestEntry.score?.points ?? 0} points.`
    : 'No single entry has taken the crown yet.';
  const missed = input.missingPillars[0]
    ? `${PILLARS[input.missingPillars[0]].label} stayed quiet. Easy place to steal points tomorrow.`
    : `${pillarLabel(weakest)} was the lightest pillar, but it still clocked in.`;

  return [
    buildInsight(
      'strongest_pillar',
      'Strongest pillar',
      rawText(raw, 'strongest_pillar') ??
        (strongest
          ? `${PILLARS[strongest].label} carried with ${input.strongestPillar?.points ?? 0} points.`
          : 'No pillar has separated from the pack yet.'),
      strongest ? PILLARS[strongest].label : null,
      strongest,
    ),
    buildInsight(
      'weakest_pillar',
      'Weakest pillar',
      rawText(raw, 'weakest_pillar') ??
        (weakest ? `${PILLARS[weakest].label} left points on the table.` : 'No weak pillar detected yet.'),
      weakest ? PILLARS[weakest].label : null,
      weakest,
    ),
    buildInsight(
      'best_entry',
      'Best entry',
      rawText(raw, 'best_entry') ?? rawText(raw, 'top_activity') ?? bestEntryCopy,
      bestEntry ? displayActivity(bestEntry) : null,
      bestEntry?.score?.wellnessPillar ?? bestEntry?.wellnessPillar ?? null,
    ),
    buildInsight('missed_opportunity', 'Missed opportunity', rawText(raw, 'missed_opportunity') ?? missed),
    buildInsight('friend_context', 'Friend context', rawText(raw, 'friend_context') ?? friendContext),
    buildInsight(
      'tomorrow_recommendation',
      'Tomorrow',
      rawText(raw, 'tomorrow_recommendation') ?? buildRecommendation(input).body,
    ),
    buildInsight(
      'share_quote',
      'Share quote',
      rawText(raw, 'share_quote') ?? buildShareQuote(input, raw),
    ),
  ];
}

function buildShareQuote(input: DigestInputSummary, raw?: Record<string, unknown>) {
  const rawQuote = rawText(raw, 'share_quote');
  if (rawQuote) return rawQuote;
  const strongest = input.strongestPillar?.pillar;
  const weakest = input.weakestPillar?.pillar;

  if (input.entries.length === 0) {
    return 'Not enough proof to judge the empire yet. Log a few more wins.';
  }

  if (input.daySummary.fullyDialed) {
    return `Fully Dialed. ${input.totalPoints} points, four pillars, no dramatic speeches required.`;
  }

  if (strongest && weakest) {
    return `${PILLARS[strongest].label} carried. ${PILLARS[weakest].label} has been invited to tomorrow.`;
  }

  return `${input.totalPoints} Dialed Points. Proof stacked. Excuses took the day off.`;
}

function buildBody(input: DigestInputSummary) {
  if (input.entries.length === 0) {
    return 'Not enough proof to judge the empire yet. Log a few more wins and the narrator will have something to chew on.';
  }

  const strongest = input.strongestPillar?.pillar;
  const weakest = input.weakestPillar?.pillar;
  const best = input.bestEntry;
  const percent = input.scorePercent;
  const missingLine =
    input.missingPillars.length > 0
      ? `${PILLARS[input.missingPillars[0]].label} left the group chat.`
      : 'Every pillar showed up and signed the guest book.';

  return `${percent}% Dialed today. ${
    strongest ? `${PILLARS[strongest].label} carried` : 'Proof showed up'
  }${best ? `, with ${displayActivity(best)} doing real work` : ''}. ${
    weakest ? `${PILLARS[weakest].label} has room for mischief tomorrow.` : missingLine
  } ${missingLine}`;
}

function serializeScoreSummary(input: DigestInputSummary) {
  return {
    total_points: input.totalPoints,
    score_percent: input.scorePercent,
    completed_pillars: input.completedPillars,
    missing_pillars: input.missingPillars,
    entry_count: input.entries.length,
    pending_entries: input.pendingEntries,
    strongest_pillar: input.strongestPillar?.pillar ?? null,
    weakest_pillar: input.weakestPillar?.pillar ?? null,
    best_entry: input.bestEntry
      ? {
          id: input.bestEntry.id,
          activity: displayActivity(input.bestEntry),
          points: input.bestEntry.score?.points ?? 0,
          pillar: input.bestEntry.score?.wellnessPillar ?? input.bestEntry.wellnessPillar,
        }
      : null,
    streak: input.streak
      ? {
          current_streak: input.streak.currentStreak,
          longest_streak: input.streak.longestStreak,
          source: input.streak.source,
        }
      : null,
    leaderboard: input.leaderboardRow
      ? {
          rank: input.leaderboardRow.rank,
          points: input.leaderboardRow.points,
        }
      : null,
    pillar_points: input.pillarProgress.reduce<Record<string, number>>((acc, pillar) => {
      acc[pillar.pillar] = pillar.points;
      return acc;
    }, {}),
  };
}

function insightsToPayload(insights: DigestInsight[]) {
  return insights.reduce<Record<string, string>>((acc, insight) => {
    acc[insight.key] = insight.body;
    return acc;
  }, {});
}

function digestFromPayload({
  input,
  title,
  body,
  tone,
  rawInsights,
  source,
  persisted,
  row,
  metadata,
}: {
  input: DigestInputSummary;
  title: string;
  body: string;
  tone: DigestTone;
  rawInsights?: Record<string, unknown>;
  source: DailyDigest['source'];
  persisted: boolean;
  row?: DailyDigestRow | null;
  metadata?: Record<string, unknown>;
}): DailyDigest {
  const recommendation = buildRecommendation(input);
  const insights = buildInsightsFromInput(input, rawInsights);
  return {
    id: row?.id,
    userId: input.userId,
    digestDate: input.date,
    tone,
    title,
    body,
    insights,
    scoreSummary: input,
    recommendation,
    shareQuote: rawText(rawInsights, 'share_quote') ?? buildShareQuote(input, rawInsights),
    source,
    persisted,
    createdAt: row?.created_at,
    updatedAt: row?.updated_at,
    metadata,
  };
}

function mergeEdgeInsights(edge: EdgeDigestResponse, input: DigestInputSummary) {
  const raw = edge.insights ?? {};
  const missing = rawStringArray(raw, 'missing_pillars');
  return {
    ...raw,
    weakest_pillar:
      rawText(raw, 'weakest_pillar') ??
      (missing[0] ? `${PILLARS[missing[0] as WellnessPillar]?.label ?? missing[0]} stayed quiet.` : null),
    best_entry: rawText(raw, 'best_entry') ?? rawText(raw, 'top_activity'),
    share_quote: rawText(raw, 'share_quote') ?? buildShareQuote(input, raw),
  };
}

export async function buildDigestInput(date: string | Date = new Date()): Promise<DigestInputSummary> {
  const digestDate = normalizeDate(date);
  const userId = await getAuthenticatedUserId();
  const [profile, entries, dailyScore, streak, leaderboardRows] = await Promise.all([
    getMyProfile(userId).catch(() => null),
    getEntriesForDate(userId, digestDate).catch(() => []),
    getDailyScore(userId, digestDate).catch(() => null),
    getUserStreak(userId).catch(() => null),
    getDailyFriendsLeaderboard(userId, digestDate).catch(() => []),
  ]);
  const daySummary = recomputeLocalDaySummary(entries, undefined, digestDate, dailyScore);
  const missingPillars = PILLAR_ORDER.filter((pillar) => !daySummary.completedPillars.includes(pillar));
  const strongestPillar = pickStrongest(daySummary.pillarProgress);
  const weakestPillar = pickWeakest(daySummary.pillarProgress, missingPillars);
  const bestEntry =
    [...entries].sort((a, b) => (b.score?.points ?? 0) - (a.score?.points ?? 0))[0] ?? null;
  const leaderboardRow = leaderboardRows.find((row) => row.userId === userId) ?? null;

  return {
    userId,
    date: digestDate,
    profile,
    entries,
    dailyScore,
    daySummary,
    totalPoints: daySummary.totalPoints,
    scorePercent: scorePercent(daySummary.totalPoints, daySummary.completedPillars.length),
    pillarProgress: daySummary.pillarProgress,
    completedPillars: daySummary.completedPillars,
    missingPillars,
    strongestPillar,
    weakestPillar,
    bestEntry,
    pendingEntries: daySummary.pendingEntries,
    streak,
    leaderboardRow,
    leaderboardRows,
  };
}

export async function getDigestForDate(date: string | Date = new Date()) {
  const input = await buildDigestInput(date);
  const { data, error } = await supabase
    .from('daily_digests')
    .select('*')
    .eq('user_id', input.userId)
    .eq('digest_date', input.date)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as DailyDigestRow;
  return digestFromPayload({
    input,
    title: row.title,
    body: row.body,
    tone: row.tone,
    rawInsights: row.insights,
    source: 'stored',
    persisted: true,
    row,
    metadata: {
      score_summary: row.score_summary,
    },
  });
}

export function fallbackDigestGenerator(input: DigestInputSummary): DailyDigest {
  const rawInsights = {
    share_quote: buildShareQuote(input),
  };

  return digestFromPayload({
    input,
    title: input.entries.length === 0 ? 'The Empire Needs Evidence' : 'Daily Recap',
    body: buildBody(input),
    tone: 'twain',
    rawInsights,
    source: 'fallback',
    persisted: false,
    metadata: {
      fallback_reason: 'edge_function_unavailable_or_failed',
      safety: 'action_based_non_medical_copy',
    },
  });
}

export async function saveDigest(digest: DailyDigest): Promise<DailyDigest> {
  const { data, error } = await supabase
    .from('daily_digests')
    .upsert(
      {
        user_id: digest.userId,
        digest_date: digest.digestDate,
        title: digest.title,
        body: digest.body,
        tone: digest.tone,
        insights: insightsToPayload(digest.insights),
        score_summary: serializeScoreSummary(digest.scoreSummary),
      },
      { onConflict: 'user_id,digest_date' },
    )
    .select('*')
    .single();

  if (error) throw error;

  const row = data as DailyDigestRow;
  return digestFromPayload({
    input: digest.scoreSummary,
    title: row.title,
    body: row.body,
    tone: row.tone,
    rawInsights: row.insights,
    source: digest.source,
    persisted: true,
    row,
  });
}

export async function generateDigestForDate(date: string | Date = new Date()) {
  const input = await buildDigestInput(date);
  const payload = {
    user_id: input.userId,
    digest_date: input.date,
    tone: 'twain' as const,
  };

  try {
    const { data, error } = await supabase.functions.invoke('generate-digest', {
      body: payload,
    });

    if (error) throw error;

    const edge = data as EdgeDigestResponse;
    if (edge?.error) throw new Error(edge.error);

    const rawInsights = mergeEdgeInsights(edge, input);
    const digest = digestFromPayload({
      input,
      title: edge.title ?? 'Daily Recap',
      body: edge.body ?? buildBody(input),
      tone: edge.tone ?? 'twain',
      rawInsights,
      source: 'edge',
      persisted: true,
      metadata: {
        score_summary: edge.score_summary ?? null,
      },
    });
    track('digest_generated', { date: input.date, source: 'edge' });
    return digest;
  } catch (edgeError) {
    track('digest_failed', {
      date: input.date,
      stage: 'edge',
      message: edgeError instanceof Error ? edgeError.message : 'unknown',
    });

    const fallback = fallbackDigestGenerator(input);
    try {
      const saved = await saveDigest(fallback);
      track('digest_generated', { date: input.date, source: 'fallback_saved' });
      return saved;
    } catch (saveError) {
      track('digest_generated', { date: input.date, source: 'fallback_local' });
      return {
        ...fallback,
        metadata: {
          ...fallback.metadata,
          save_error: saveError instanceof Error ? saveError.message : 'daily_digests write blocked',
        },
      };
    }
  }
}

export function getWeeklyDigestPlaceholder() {
  return {
    title: 'Weekly Recap',
    body: 'Seven days, one verdict. This becomes a Pro recap once weekly aggregation is wired.',
    locked: true,
    hooks: ['weekly_reels', 'premium_digest_archive', 'smart_recommendations'],
  };
}
