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

type SyncRevenueCatOutput = {
  user_id: string;
  revenuecat_customer_id: string;
  entitlement: string;
  status: string;
  current_period_end: string | null;
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
    event.app_user_id,
    event.original_app_user_id,
    ...(event.aliases ?? []),
    event.subscriber_attributes?.supabase_user_id?.value,
  ];
  return candidates.find(isUuid) ?? null;
}

function subscriptionStatus(eventType?: string): string {
  if (!eventType) return 'active';
  return ['EXPIRATION', 'CANCELLATION', 'BILLING_ISSUE', 'PRODUCT_CHANGE'].includes(eventType)
    ? 'inactive'
    : 'active';
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
    const entitlement = event.entitlement_id ?? event.product_id ?? 'dialed_pro';
    const status = subscriptionStatus(event.type);
    const currentPeriodEnd = event.expiration_at_ms
      ? new Date(Number(event.expiration_at_ms)).toISOString()
      : null;

    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    const { error: subscriptionError } = await serviceClient.from('subscriptions').upsert({
      user_id: userId,
      revenuecat_customer_id: revenuecatCustomerId,
      entitlement,
      status,
      current_period_end: currentPeriodEnd,
      updated_at: new Date().toISOString(),
    });
    if (subscriptionError) throw subscriptionError;

    const { error: profileError } = await serviceClient
      .from('profiles')
      .update({
        is_pro: status === 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    if (profileError) throw profileError;

    // TODO: Persist the raw webhook payload to an audit table once subscription_events exists.
    const output: SyncRevenueCatOutput = {
      user_id: userId,
      revenuecat_customer_id: revenuecatCustomerId,
      entitlement,
      status,
      current_period_end: currentPeriodEnd,
    };

    return json(output);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'sync-revenuecat-webhook failed.' }, 400);
  }
});
