import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type RevenueCatEvent = {
  app_user_id?: string;
  original_app_user_id?: string;
  aliases?: string[];
  subscriber_attributes?: Record<string, { value?: string }>;
  entitlement_id?: string;
  product_id?: string;
  type?: string;
  expiration_at_ms?: number | string | null;
};

type RevenueCatWebhookPayload = {
  event?: RevenueCatEvent;
  [key: string]: unknown;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

function isUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  );
}

function eventFromPayload(payload: RevenueCatWebhookPayload): RevenueCatEvent {
  return (payload.event ?? payload) as RevenueCatEvent;
}

function resolveSupabaseUserId(event: RevenueCatEvent): string | null {
  const candidates = [
    event.subscriber_attributes?.supabase_user_id?.value,
    event.app_user_id,
    event.original_app_user_id,
    ...(event.aliases ?? []),
  ];
  return candidates.find(isUuid) ?? null;
}

function subscriptionStatus(eventType?: string): string {
  switch (eventType) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'UNCANCELLATION':
    case 'NON_RENEWING_PURCHASE':
      return 'active';
    case 'TRIAL_STARTED':
      return 'trialing';
    case 'BILLING_ISSUE':
      return 'billing_issue';
    case 'CANCELLATION':
      return 'cancelled';
    case 'EXPIRATION':
      return 'expired';
    default:
      return 'active';
  }
}

Deno.serve(async (req) => {
  try {
    const expectedAuth = Deno.env.get('REVENUECAT_WEBHOOK_AUTH');
    if (expectedAuth && req.headers.get('Authorization') !== `Bearer ${expectedAuth}`) {
      return json({ error: 'Unauthorized.' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: 'sync-revenuecat-webhook is not configured.' }, 500);
    }

    const payload = (await req.json()) as RevenueCatWebhookPayload;
    const event = eventFromPayload(payload);
    const userId = resolveSupabaseUserId(event);
    if (!userId) {
      return json({ error: 'Could not map RevenueCat customer to a Supabase user UUID.' }, 400);
    }

    const revenuecatCustomerId = event.app_user_id ?? event.original_app_user_id ?? userId;
    const entitlement = event.entitlement_id ?? 'dialed_pro';
    const status = subscriptionStatus(event.type);
    const productId = event.product_id ?? null;
    const currentPeriodEnd = event.expiration_at_ms
      ? new Date(Number(event.expiration_at_ms)).toISOString()
      : null;

    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    const { error: eventError } = await serviceClient.from('subscription_events').insert({
      user_id: userId,
      revenuecat_customer_id: revenuecatCustomerId,
      event_type: event.type ?? 'UNKNOWN',
      payload,
    });
    if (eventError) throw eventError;

    const { error: subscriptionError } = await serviceClient.from('subscriptions').upsert({
      user_id: userId,
      revenuecat_customer_id: revenuecatCustomerId,
      entitlement,
      status,
      product_id: productId,
      current_period_end: currentPeriodEnd,
      updated_at: new Date().toISOString(),
    });
    if (subscriptionError) throw subscriptionError;

    const { error: profileError } = await serviceClient
      .from('profiles')
      .update({
        is_pro: status === 'active' || status === 'trialing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    if (profileError) throw profileError;

    return json({
      user_id: userId,
      revenuecat_customer_id: revenuecatCustomerId,
      entitlement,
      status,
      product_id: productId,
      current_period_end: currentPeriodEnd,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'sync-revenuecat-webhook failed.' }, 400);
  }
});
