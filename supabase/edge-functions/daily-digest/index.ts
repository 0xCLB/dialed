import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (_req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Digest function is not configured.' }, 500);
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey);
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await serviceClient
    .from('leaderboard_scores')
    .select('user_id, score, entries_count')
    .eq('scope', 'daily')
    .eq('period_start', today);

  if (error) {
    return json({ error: error.message }, 400);
  }

  const notifications = (data ?? []).map((row) => ({
    user_id: row.user_id,
    type: 'digest',
    title: 'Daily digest',
    body: `${row.score} Dialed Points from ${row.entries_count} proofs today.`,
    data: { date: today, score: row.score, entries: row.entries_count },
  }));

  if (notifications.length > 0) {
    const { error: insertError } = await serviceClient.from('notifications').insert(notifications);
    if (insertError) {
      return json({ error: insertError.message }, 400);
    }
  }

  return json({ ok: true, notifications: notifications.length });
});
