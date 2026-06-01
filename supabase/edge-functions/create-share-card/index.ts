import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type ShareAssetType = 'story_card' | 'reel' | 'leaderboard_card' | 'digest_card';

type CreateShareCardInput = {
  entry_id?: string;
  score_date?: string;
  template_id: string;
  asset_type?: ShareAssetType;
  visibility?: 'private' | 'public';
  extension?: 'png' | 'jpg' | 'jpeg' | 'mp4';
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
  if (payload.asset_type && !['story_card', 'reel', 'leaderboard_card', 'digest_card'].includes(payload.asset_type)) {
    throw new Error('asset_type is invalid.');
  }
  if (payload.visibility && !['private', 'public'].includes(payload.visibility)) {
    throw new Error('visibility is invalid.');
  }
  if (payload.extension && !['png', 'jpg', 'jpeg', 'mp4'].includes(payload.extension)) {
    throw new Error('extension is invalid.');
  }

  return {
    entry_id: payload.entry_id,
    score_date: payload.score_date,
    template_id: payload.template_id.slice(0, 80),
    asset_type: payload.asset_type ?? (payload.entry_id ? 'story_card' : 'digest_card'),
    visibility: payload.visibility ?? 'private',
    extension: payload.extension ?? (payload.asset_type === 'reel' ? 'mp4' : 'png'),
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
        .select('id')
        .eq('id', payload.entry_id)
        .eq('user_id', authData.user.id)
        .neq('status', 'deleted')
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

    const assetId = crypto.randomUUID();
    const storagePath = `share-assets/${authData.user.id}/${assetId}.${payload.extension}`;

    const { data: asset, error: insertError } = await serviceClient
      .from('share_assets')
      .insert({
        id: assetId,
        user_id: authData.user.id,
        entry_id: payload.entry_id ?? null,
        score_date: payload.score_date ?? null,
        asset_type: payload.asset_type,
        template_id: payload.template_id,
        bucket_id: 'share-assets',
        storage_path: storagePath,
        visibility: payload.visibility,
        status: 'pending_upload',
        metadata: {
          rendering_mode: 'mobile_first_stub',
          TODO: 'Render card/reel on-device first; add cloud rendering after visual templates settle.',
        },
      })
      .select('id, storage_path, status, visibility')
      .single();

    if (insertError) throw insertError;

    return json({
      share_asset_id: asset.id,
      upload_path: asset.storage_path,
      bucket_id: 'share-assets',
      status: asset.status,
      visibility: asset.visibility,
      template_id: payload.template_id,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'create-share-card failed.' }, 400);
  }
});
