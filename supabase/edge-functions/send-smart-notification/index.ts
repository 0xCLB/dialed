import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type NotificationType =
  | 'friend_request'
  | 'reaction'
  | 'comment'
  | 'leaderboard'
  | 'challenge'
  | 'digest'
  | 'streak'
  | 'subscription'
  | 'system';

type SmartNotificationInput = {
  user_id: string;
  actor_id?: string;
  notification_type: NotificationType;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-dialed-internal-token',
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
  if (
    !payload.notification_type ||
    !['friend_request', 'reaction', 'comment', 'leaderboard', 'challenge', 'digest', 'streak', 'subscription', 'system'].includes(
      payload.notification_type,
    )
  ) {
    throw new Error('notification_type is invalid.');
  }

  return {
    user_id: payload.user_id,
    actor_id: payload.actor_id,
    notification_type: payload.notification_type,
    title: payload.title?.slice(0, 120),
    body: payload.body?.slice(0, 500),
    data: payload.data ?? {},
  };
}

function interestScore(payload: SmartNotificationInput): number {
  const baseByType: Record<NotificationType, number> = {
    friend_request: 85,
    reaction: 62,
    comment: 76,
    leaderboard: 70,
    challenge: 72,
    digest: 55,
    streak: 80,
    subscription: 35,
    system: 30,
  };
  const socialBonus = payload.actor_id ? 10 : 0;
  const urgencyBonus = payload.data?.urgent === true ? 15 : 0;
  return Math.max(0, Math.min(100, baseByType[payload.notification_type] + socialBonus + urgencyBonus));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const expectedInternalToken = Deno.env.get('DIALED_INTERNAL_FUNCTION_TOKEN');
    if (expectedInternalToken && req.headers.get('x-dialed-internal-token') !== expectedInternalToken) {
      return json({ error: 'Unauthorized.' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: 'send-smart-notification is not configured.' }, 500);
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    const payload = assertPayload(await req.json());
    const score = interestScore(payload);
    const title = payload.title ?? 'Dialed Self';
    const body = payload.body ?? 'You have a new Dialed Self update.';

    const { data, error } = await serviceClient
      .from('notifications')
      .insert({
        user_id: payload.user_id,
        actor_id: payload.actor_id ?? null,
        notification_type: payload.notification_type,
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

    return json({
      notification_id: data.id,
      interest_score: score,
      push_stubbed: true,
      TODO: 'Connect Expo push delivery after device-token rate limits and notification copy are finalized.',
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'send-smart-notification failed.' }, 400);
  }
});
