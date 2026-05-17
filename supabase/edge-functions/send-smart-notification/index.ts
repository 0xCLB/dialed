import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type SmartNotificationInput = {
  user_id: string;
  actor_id?: string;
  type: string;
  data?: Record<string, unknown>;
};

type SmartNotificationOutput = {
  notification_id: string;
  interest_score: number;
  push_stubbed: boolean;
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

function assertPayload(value: unknown): SmartNotificationInput {
  const payload = value as Partial<SmartNotificationInput>;
  if (!isUuid(payload.user_id)) throw new Error('user_id must be a UUID.');
  if (payload.actor_id && !isUuid(payload.actor_id)) throw new Error('actor_id must be a UUID.');
  if (!payload.type || typeof payload.type !== 'string') throw new Error('type is required.');
  return {
    user_id: payload.user_id,
    actor_id: payload.actor_id,
    type: payload.type.slice(0, 80),
    data: payload.data ?? {},
  };
}

function interestScore(payload: SmartNotificationInput): number {
  const baseByType: Record<string, number> = {
    friend_request: 85,
    reaction: 62,
    comment: 76,
    leaderboard: 70,
    challenge: 72,
    digest: 55,
    streak: 80,
  };
  const base = baseByType[payload.type] ?? 45;
  const socialBonus = payload.actor_id ? 10 : 0;
  const urgencyBonus = payload.data?.urgent === true ? 15 : 0;
  return Math.max(0, Math.min(100, base + socialBonus + urgencyBonus));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: 'send-smart-notification is not configured.' }, 500);
    }

    // Service-role function: callers should be server jobs or trusted Edge Functions.
    // TODO: Add an internal HMAC header for server-to-server calls before production.
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    const payload = assertPayload(await req.json());
    const score = interestScore(payload);
    const title = String(payload.data?.title ?? 'Dialed Self');
    const body = String(payload.data?.body ?? 'You have a new Dialed Self update.');

    const { data, error } = await serviceClient
      .from('notifications')
      .insert({
        user_id: payload.user_id,
        actor_id: payload.actor_id ?? null,
        type: payload.type,
        title,
        body,
        data: {
          ...payload.data,
          interest_score: score,
          push_delivery: 'stubbed',
        },
      })
      .select('id')
      .single();

    if (error) throw error;

    // TODO: Connect Expo push delivery after device token schema and rate limits are finalized.
    const output: SmartNotificationOutput = {
      notification_id: data.id,
      interest_score: score,
      push_stubbed: true,
    };

    return json(output);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'send-smart-notification failed.' }, 400);
  }
});
