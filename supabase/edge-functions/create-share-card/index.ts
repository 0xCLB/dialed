import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type CreateShareCardInput = {
  entry_id?: string;
  score_date?: string;
  template_id: string;
};

type CreateShareCardOutput = {
  asset_url: string;
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

function assertPayload(value: unknown): CreateShareCardInput {
  const payload = value as Partial<CreateShareCardInput>;
  if (!payload.template_id || typeof payload.template_id !== 'string') {
    throw new Error('template_id is required.');
  }
  if (payload.entry_id && !isUuid(payload.entry_id)) {
    throw new Error('entry_id must be a UUID.');
  }
  if (payload.score_date && !/^\d{4}-\d{2}-\d{2}$/.test(payload.score_date)) {
    throw new Error('score_date must be YYYY-MM-DD.');
  }
  if (!payload.entry_id && !payload.score_date) {
    throw new Error('entry_id or score_date is required.');
  }
  return {
    entry_id: payload.entry_id,
    score_date: payload.score_date,
    template_id: payload.template_id.slice(0, 80),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: 'create-share-card is not configured.' }, 500);
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) return json({ error: 'Unauthorized.' }, 401);

    const payload = assertPayload(await req.json());

    if (payload.entry_id) {
      const { data: entry, error } = await serviceClient
        .from('entries')
        .select('id, user_id')
        .eq('id', payload.entry_id)
        .eq('user_id', authData.user.id)
        .maybeSingle();
      if (error) throw error;
      if (!entry) return json({ error: 'Entry not found for authenticated user.' }, 404);
    }

    if (payload.score_date) {
      const { data: score, error } = await serviceClient
        .from('daily_scores')
        .select('id')
        .eq('user_id', authData.user.id)
        .eq('score_date', payload.score_date)
        .maybeSingle();
      if (error) throw error;
      if (!score) return json({ error: 'Daily score not found for authenticated user.' }, 404);
    }

    // TODO: Local mobile rendering is the primary v1 path. The app should render
    // cards/reels on-device and upload them to share-assets/{user_id}/{asset_id}.png.
    // TODO: Add cloud rendering later for scheduled digests, server-generated cards,
    // and video export workflows.
    const assetId = crypto.randomUUID();
    const output: CreateShareCardOutput = {
      asset_url: `share-assets/${authData.user.id}/${assetId}.png`,
    };

    return json({
      ...output,
      template_id: payload.template_id,
      rendering_mode: 'mobile_first_stub',
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'create-share-card failed.' }, 400);
  }
});
