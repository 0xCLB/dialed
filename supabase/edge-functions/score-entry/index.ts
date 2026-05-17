import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type EntryType = 'photo' | 'manual' | 'health' | 'location';
type WellnessPillar = 'movement' | 'fuel' | 'mind' | 'recovery';

type ScoreEntryInput = {
  entry_id: string;
  user_id: string;
  type: EntryType;
  caption?: string;
  activity_tag?: string;
  photo_url?: string;
  health_metadata?: Record<string, unknown>;
};

type ScoreEntryOutput = {
  normalized_activity: string;
  wellness_pillar: WellnessPillar;
  base_points: number;
  bonus_points: number;
  total_points: number;
  confidence: number;
  ai_subtext: string;
  flagged: boolean;
  flag_reason?: string;
  scoring_explanation: string;
};

type EntryRow = {
  id: string;
  user_id: string;
  created_at: string;
  caption: string | null;
  activity_tag: string | null;
  photo_url: string | null;
};

type ExistingStreak = {
  current_streak: number | null;
  longest_streak: number | null;
  last_completed_date: string | null;
  movement_streak: number | null;
  fuel_streak: number | null;
  mind_streak: number | null;
  recovery_streak: number | null;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

function isUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  );
}

function assertPayload(value: unknown): ScoreEntryInput {
  const payload = value as Partial<ScoreEntryInput>;
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid JSON payload.');
  }
  if (!isUuid(payload.entry_id)) {
    throw new Error('entry_id must be a UUID.');
  }
  if (!isUuid(payload.user_id)) {
    throw new Error('user_id must be a UUID.');
  }
  if (!payload.type || !['photo', 'manual', 'health', 'location'].includes(payload.type)) {
    throw new Error('type must be photo, manual, health, or location.');
  }

  return {
    entry_id: payload.entry_id,
    user_id: payload.user_id,
    type: payload.type,
    caption: payload.caption?.slice(0, 500),
    activity_tag: payload.activity_tag?.slice(0, 80),
    photo_url: payload.photo_url?.slice(0, 500),
    health_metadata: payload.health_metadata ?? {},
  };
}

function normalizeActivity(payload: ScoreEntryInput): string {
  const raw = payload.activity_tag || payload.caption || payload.type;
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64) || payload.type;
}

function inferPillar(payload: ScoreEntryInput): WellnessPillar {
  const text = `${payload.activity_tag ?? ''} ${payload.caption ?? ''}`.toLowerCase();

  if (/(gym|run|walk|lift|workout|sport|hike|steps|cardio|class)/.test(text)) return 'movement';
  if (/(water|protein|meal|hydration|fast|supplement|grocery|calorie)/.test(text)) return 'fuel';
  if (/(read|journal|meditat|deep work|therapy|learn|study|mindful)/.test(text)) return 'mind';
  if (/(sleep|sauna|stretch|mobility|rest|cold|breath)/.test(text)) return 'recovery';

  if (payload.type === 'health') return 'movement';
  return 'mind';
}

function numberFromMetadata(metadata: Record<string, unknown>, key: string): number {
  const value = metadata[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function fallbackScore(payload: ScoreEntryInput): ScoreEntryOutput {
  const wellness_pillar = inferPillar(payload);
  const normalized_activity = normalizeActivity(payload);
  const health = payload.health_metadata ?? {};
  const captionLength = payload.caption?.trim().length ?? 0;
  const hasPhoto = Boolean(payload.photo_url);

  const proofBonus = payload.type === 'photo' && hasPhoto ? 14 : payload.type === 'health' ? 10 : 4;
  const detailBonus = captionLength >= 30 ? 8 : captionLength > 0 ? 3 : 0;
  const healthBonus = Math.min(
    18,
    Math.round(
      numberFromMetadata(health, 'steps') / 1500 +
        numberFromMetadata(health, 'active_calories') / 60 +
        numberFromMetadata(health, 'workout_minutes') / 5 +
        numberFromMetadata(health, 'sleep_hours') * 1.5,
    ),
  );
  const base_points = 40 + proofBonus;
  const bonus_points = detailBonus + healthBonus;
  const total_points = Math.max(5, Math.min(100, base_points + bonus_points));
  const confidence = Math.min(0.95, hasPhoto ? 0.82 : payload.type === 'health' ? 0.88 : 0.68);
  const flagged = captionLength > 0 && /(injury|sick|pain|unsafe)/i.test(payload.caption ?? '');

  return {
    normalized_activity,
    wellness_pillar,
    base_points,
    bonus_points,
    total_points,
    confidence,
    ai_subtext: `${normalized_activity.replace(/_/g, ' ')} scored as ${wellness_pillar} proof for ${total_points} Dialed Points.`,
    flagged,
    flag_reason: flagged ? 'Safety-sensitive language detected for later review.' : undefined,
    scoring_explanation:
      'Fallback scoring used rule-based proof, detail, and health metadata bonuses. TODO: replace or augment with server-side AI scoring.',
  };
}

function dateWindow(scoreDate: string) {
  const start = `${scoreDate}T00:00:00.000Z`;
  const next = new Date(`${scoreDate}T00:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return { start, end: next.toISOString() };
}

function yesterday(date: string): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0, 10);
}

async function recomputeDailyScores(
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
  scoreDate: string,
) {
  const { start, end } = dateWindow(scoreDate);
  const { data: entries, error } = await serviceClient
    .from('entries')
    .select('wellness_pillar, points')
    .eq('user_id', userId)
    .gte('created_at', start)
    .lt('created_at', end);

  if (error) throw error;

  const totals: Record<WellnessPillar, number> = {
    movement: 0,
    fuel: 0,
    mind: 0,
    recovery: 0,
  };

  for (const entry of entries ?? []) {
    const pillar = entry.wellness_pillar as WellnessPillar | null;
    if (pillar && pillar in totals) {
      totals[pillar] += Number(entry.points ?? 0);
    }
  }

  const completedPillars = Object.values(totals).filter((points) => points > 0).length;
  const totalPoints = Object.values(totals).reduce((sum, points) => sum + points, 0);

  const { error: upsertError } = await serviceClient.from('daily_scores').upsert(
    {
      user_id: userId,
      score_date: scoreDate,
      total_points: totalPoints,
      movement_points: totals.movement,
      fuel_points: totals.fuel,
      mind_points: totals.mind,
      recovery_points: totals.recovery,
      completed_pillars: completedPillars,
      all_pillars_completed: completedPillars === 4,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,score_date' },
  );

  if (upsertError) throw upsertError;
  return { totals, completedPillars, totalPoints };
}

async function recomputeStreaks(
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
  scoreDate: string,
  totals: Record<WellnessPillar, number>,
) {
  const { data: existing, error } = await serviceClient
    .from('streaks')
    .select(
      'current_streak, longest_streak, last_completed_date, movement_streak, fuel_streak, mind_streak, recovery_streak',
    )
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  const existingStreak = existing as ExistingStreak | null;

  const wasAlreadyCompletedToday = existingStreak?.last_completed_date === scoreDate;
  const continues = existingStreak?.last_completed_date === yesterday(scoreDate);
  const current = wasAlreadyCompletedToday
    ? Number(existingStreak?.current_streak ?? 1)
    : continues
      ? Number(existingStreak?.current_streak ?? 0) + 1
      : 1;
  const longest = Math.max(current, Number(existingStreak?.longest_streak ?? 0));

  const nextPillarStreak = (pillar: WellnessPillar, previous: number | null | undefined) =>
    totals[pillar] > 0 ? (wasAlreadyCompletedToday ? Number(previous ?? 1) : Number(previous ?? 0) + 1) : 0;

  const { error: upsertError } = await serviceClient.from('streaks').upsert({
    user_id: userId,
    current_streak: current,
    longest_streak: longest,
    last_completed_date: scoreDate,
    movement_streak: nextPillarStreak('movement', existingStreak?.movement_streak),
    fuel_streak: nextPillarStreak('fuel', existingStreak?.fuel_streak),
    mind_streak: nextPillarStreak('mind', existingStreak?.mind_streak),
    recovery_streak: nextPillarStreak('recovery', existingStreak?.recovery_streak),
    updated_at: new Date().toISOString(),
  });

  if (upsertError) throw upsertError;

  await serviceClient
    .from('daily_scores')
    .update({ streak_count: current, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('score_date', scoreDate);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: 'score-entry is not configured.' }, 500);
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) {
      return json({ error: 'Unauthorized.' }, 401);
    }

    const payload = assertPayload(await req.json());
    if (payload.user_id !== authData.user.id) {
      return json({ error: 'Payload user_id must match the authenticated user.' }, 403);
    }

    const { data: entry, error: entryError } = await serviceClient
      .from('entries')
      .select('id, user_id, created_at, caption, activity_tag, photo_url')
      .eq('id', payload.entry_id)
      .eq('user_id', payload.user_id)
      .maybeSingle();

    if (entryError) throw entryError;
    if (!entry) {
      return json({ error: 'Entry not found for authenticated user.' }, 404);
    }
    const ownedEntry = entry as EntryRow;

    const result = fallbackScore({
      ...payload,
      caption: payload.caption ?? ownedEntry.caption ?? undefined,
      activity_tag: payload.activity_tag ?? ownedEntry.activity_tag ?? undefined,
      photo_url: payload.photo_url ?? ownedEntry.photo_url ?? undefined,
    });

    const { error: updateError } = await serviceClient
      .from('entries')
      .update({
        type: payload.type,
        caption: payload.caption ?? ownedEntry.caption,
        activity_tag: payload.activity_tag ?? ownedEntry.activity_tag,
        photo_url: payload.photo_url ?? ownedEntry.photo_url,
        normalized_activity: result.normalized_activity,
        wellness_pillar: result.wellness_pillar,
        base_points: result.base_points,
        bonus_points: result.bonus_points,
        points: result.total_points,
        confidence: result.confidence,
        ai_subtext: result.ai_subtext,
        scoring_source: 'rule',
        flagged: result.flagged,
        flag_reason: result.flag_reason ?? null,
        metadata: {
          health_metadata: payload.health_metadata ?? {},
          scoring_explanation: result.scoring_explanation,
          score_entry_stub: true,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.entry_id)
      .eq('user_id', payload.user_id);

    if (updateError) throw updateError;

    const scoreDate = ownedEntry.created_at.slice(0, 10);
    const daily = await recomputeDailyScores(serviceClient, payload.user_id, scoreDate);
    await recomputeStreaks(serviceClient, payload.user_id, scoreDate, daily.totals);

    const output: ScoreEntryOutput = result;
    return json(output);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'score-entry failed.' }, 400);
  }
});
