import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type GenerateDigestInput = {
  user_id: string;
  digest_date: string;
};

type GenerateDigestOutput = {
  title: string;
  body: string;
  insights: Record<string, unknown>;
  score_summary: Record<string, unknown>;
};

type EntrySummary = {
  wellness_pillar: string | null;
  points: number | null;
  normalized_activity: string | null;
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
  if (!isUuid(payload.user_id)) throw new Error('user_id must be a UUID.');
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
    if (payload.user_id !== authData.user.id) {
      return json({ error: 'Cannot generate another user digest.' }, 403);
    }

    const { start, end } = dateWindow(payload.digest_date);
    const [{ data: entries, error: entriesError }, { data: score, error: scoreError }] = await Promise.all([
      serviceClient
        .from('entries')
        .select('wellness_pillar, points, normalized_activity')
        .eq('user_id', payload.user_id)
        .gte('created_at', start)
        .lt('created_at', end),
      serviceClient
        .from('daily_scores')
        .select('*')
        .eq('user_id', payload.user_id)
        .eq('score_date', payload.digest_date)
        .maybeSingle(),
    ]);

    if (entriesError) throw entriesError;
    if (scoreError) throw scoreError;

    const typedEntries = (entries ?? []) as EntrySummary[];
    const topActivity = typedEntries[0]?.normalized_activity?.replace(/_/g, ' ') ?? 'wellness check-in';
    const totalPoints = Number(score?.total_points ?? 0);
    const completedPillars = Number(score?.completed_pillars ?? 0);

    const output: GenerateDigestOutput = {
      title: `${payload.digest_date} Dialed Digest`,
      body: `You earned ${totalPoints} Dialed Points across ${completedPillars} wellness pillars. Top proof: ${topActivity}.`,
      insights: {
        entry_count: typedEntries.length,
        top_activity: topActivity,
        TODO: 'Replace this deterministic summary with AI narrative once prompts and evaluation are finalized.',
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
        user_id: payload.user_id,
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
