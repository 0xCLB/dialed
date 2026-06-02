import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type GenerateDigestInput = {
  user_id?: string;
  digest_date: string;
};

type EntrySummary = {
  id: string;
  entry_type: string;
  activity_tag: string | null;
};

type ScoreSummary = {
  entry_id: string;
  wellness_pillar: string;
  points: number;
  normalized_activity: string;
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

function assertPayload(value: unknown): GenerateDigestInput {
  const payload = value as Partial<GenerateDigestInput>;
  if (payload.user_id && !isUuid(payload.user_id)) throw new Error('user_id must be a UUID when provided.');
  if (!payload.digest_date || !/^\d{4}-\d{2}-\d{2}$/.test(payload.digest_date)) {
    throw new Error('digest_date must be YYYY-MM-DD.');
  }
  return { user_id: payload.user_id, digest_date: payload.digest_date };
}

function dateWindow(date: string) {
  const start = `${date}T00:00:00.000Z`;
  const next = new Date(start);
  next.setUTCDate(next.getUTCDate() + 1);
  return { start, end: next.toISOString() };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: 'generate-digest is not configured.' }, 500);
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) return json({ error: 'Unauthorized.' }, 401);

    const payload = assertPayload(await req.json());
    const userId = payload.user_id ?? authData.user.id;
    if (userId !== authData.user.id) return json({ error: 'Cannot generate another user digest.' }, 403);

    const { start, end } = dateWindow(payload.digest_date);
    const [{ data: entries, error: entriesError }, { data: score, error: scoreError }] = await Promise.all([
      serviceClient
        .from('entries')
        .select('id, entry_type, activity_tag')
        .eq('user_id', userId)
        .neq('status', 'deleted')
        .gte('occurred_at', start)
        .lt('occurred_at', end),
      serviceClient
        .from('daily_scores')
        .select('*')
        .eq('user_id', userId)
        .eq('score_date', payload.digest_date)
        .maybeSingle(),
    ]);

    if (entriesError) throw entriesError;
    if (scoreError) throw scoreError;

    const typedEntries = (entries ?? []) as EntrySummary[];
    const entryIds = typedEntries.map((entry) => entry.id);
    let typedScores: ScoreSummary[] = [];

    if (entryIds.length > 0) {
      const { data: scores, error: scoresError } = await serviceClient
        .from('entry_scores')
        .select('entry_id, wellness_pillar, points, normalized_activity')
        .eq('user_id', userId)
        .in('entry_id', entryIds);
      if (scoresError) throw scoresError;
      typedScores = (scores ?? []) as ScoreSummary[];
    }

    const totalPoints = Number(score?.total_points ?? typedScores.reduce((sum, row) => sum + Number(row.points), 0));
    const completedPillars = Number(
      score?.completed_pillars ?? new Set(typedScores.map((row) => row.wellness_pillar)).size,
    );
    const topScore = typedScores.sort((a, b) => Number(b.points) - Number(a.points))[0];
    const topActivity = topScore?.normalized_activity?.replace(/_/g, ' ') ?? 'wellness check-in';
    const missingPillars = ['movement', 'fuel', 'mind', 'recovery'].filter(
      (pillar) => !typedScores.some((row) => row.wellness_pillar === pillar),
    );

    const output = {
      title: `${payload.digest_date} Daily Recap`,
      body:
        missingPillars.length === 0
          ? `All four pillars showed up. ${totalPoints} Dialed Points says the day had receipts.`
          : `You earned ${totalPoints} Dialed Points across ${completedPillars} pillars. ${missingPillars[0]} is the next easy win.`,
      tone: 'twain',
      insights: {
        entry_count: typedEntries.length,
        top_activity: topActivity,
        missing_pillars: missingPillars,
        generation_mode: 'deterministic_template',
      },
      score_summary: {
        total_points: totalPoints,
        movement_points: score?.movement_points ?? 0,
        fuel_points: score?.fuel_points ?? 0,
        mind_points: score?.mind_points ?? 0,
        recovery_points: score?.recovery_points ?? 0,
        completed_pillars: completedPillars,
        all_pillars_completed: Boolean(score?.all_pillars_completed),
      },
    };

    const { error: upsertError } = await serviceClient.from('daily_digests').upsert(
      {
        user_id: userId,
        digest_date: payload.digest_date,
        ...output,
      },
      { onConflict: 'user_id,digest_date' },
    );

    if (upsertError) throw upsertError;
    return json(output);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'generate-digest failed.' }, 400);
  }
});
