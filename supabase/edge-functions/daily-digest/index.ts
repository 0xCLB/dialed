import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type DailyDigestJobInput = {
  user_id?: string;
  digest_date?: string;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function dateWindow(date: string) {
  const start = `${date}T00:00:00.000Z`;
  const next = new Date(start);
  next.setUTCDate(next.getUTCDate() + 1);
  return { start, end: next.toISOString() };
}

async function upsertDigest(
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
  digestDate: string,
) {
  const { start, end } = dateWindow(digestDate);
  const [{ data: entries, error: entriesError }, { data: score, error: scoreError }] = await Promise.all([
    serviceClient
      .from('entries')
      .select('normalized_activity, points, wellness_pillar')
      .eq('user_id', userId)
      .gte('created_at', start)
      .lt('created_at', end),
    serviceClient
      .from('daily_scores')
      .select('*')
      .eq('user_id', userId)
      .eq('score_date', digestDate)
      .maybeSingle(),
  ]);

  if (entriesError) throw entriesError;
  if (scoreError) throw scoreError;

  const totalPoints = Number(score?.total_points ?? 0);
  const entryCount = entries?.length ?? 0;
  const title = `${digestDate} Dialed Digest`;
  const body = `${totalPoints} Dialed Points from ${entryCount} wellness proofs.`;

  const { error } = await serviceClient.from('daily_digests').upsert(
    {
      user_id: userId,
      digest_date: digestDate,
      title,
      body,
      insights: {
        entry_count: entryCount,
        top_activity: entries?.[0]?.normalized_activity ?? null,
        TODO: 'Legacy scheduled wrapper; generate-digest owns the authenticated API path.',
      },
      score_summary: score ?? {},
    },
    { onConflict: 'user_id,digest_date' },
  );

  if (error) throw error;
  return { user_id: userId, digest_date: digestDate, title, body };
}

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: 'daily-digest is not configured.' }, 500);
    }

    const payload = (req.method === 'POST' ? await req.json().catch(() => ({})) : {}) as DailyDigestJobInput;
    const digestDate = payload.digest_date ?? todayIsoDate();
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    const userIds = payload.user_id
      ? [payload.user_id]
      : [
          ...new Set(
            (
              await serviceClient
                .from('daily_scores')
                .select('user_id')
                .eq('score_date', digestDate)
            ).data?.map((row) => row.user_id) ?? [],
          ),
        ];

    const digests = [];
    for (const userId of userIds) {
      digests.push(await upsertDigest(serviceClient, userId, digestDate));
    }

    return json({ ok: true, digests });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'daily-digest failed.' }, 400);
  }
});
