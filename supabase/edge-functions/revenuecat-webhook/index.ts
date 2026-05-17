import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  try {
    const expectedAuth = Deno.env.get('REVENUECAT_WEBHOOK_AUTH');
    if (expectedAuth && req.headers.get('Authorization') !== `Bearer ${expectedAuth}`) {
      return json({ error: 'Unauthorized.' }, 401);
    }

    const eventBody = await req.json();
    const event = eventBody.event ?? eventBody;
    const appUserId = event.app_user_id;
    const entitlement = event.entitlement_id ?? event.product_id ?? 'dialed_pro';
    const expiresAtMs = event.expiration_at_ms ?? null;
    const status = ['EXPIRATION', 'CANCELLATION', 'BILLING_ISSUE'].includes(event.type)
      ? 'inactive'
      : 'active';

    if (!appUserId) {
      return json({ error: 'Missing app_user_id.' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: 'Webhook is not configured.' }, 500);
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    const expiresAt = expiresAtMs ? new Date(Number(expiresAtMs)).toISOString() : null;

    const { error } = await serviceClient.from('subscriptions').upsert({
      user_id: appUserId,
      revenuecat_app_user_id: appUserId,
      entitlement,
      status,
      expires_at: expiresAt,
      raw_event: eventBody,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      return json({ error: error.message }, 400);
    }

    await serviceClient
      .from('profiles')
      .update({ pro_until: status === 'active' ? expiresAt : null })
      .eq('id', appUserId);

    return json({ ok: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Webhook failed.' }, 400);
  }
});
