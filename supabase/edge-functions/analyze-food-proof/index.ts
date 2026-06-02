import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type AnalyzeFoodProofInput = {
  entry_id: string;
  user_id?: string;
  storage_path: string;
  caption?: string | null;
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

function assertPayload(value: unknown): AnalyzeFoodProofInput {
  const payload = value as Partial<AnalyzeFoodProofInput>;
  if (!payload || typeof payload !== 'object') throw new Error('Invalid JSON payload.');
  if (!isUuid(payload.entry_id)) throw new Error('entry_id must be a UUID.');
  if (payload.user_id && !isUuid(payload.user_id)) throw new Error('user_id must be a UUID.');
  if (!payload.storage_path || typeof payload.storage_path !== 'string') {
    throw new Error('storage_path is required.');
  }

  return {
    entry_id: payload.entry_id,
    user_id: payload.user_id,
    storage_path: payload.storage_path.slice(0, 500),
    caption: typeof payload.caption === 'string' ? payload.caption.slice(0, 500) : null,
  };
}

function fallbackFoodAnalysis(caption: string | null, activityTag: string | null) {
  const text = `${caption ?? ''} ${activityTag ?? ''}`.toLowerCase();
  const hydration = /water|hydration|electrolyte/.test(text);
  const protein = /protein|chicken|fish|egg|yogurt|steak|tofu/.test(text);
  const wholeFood = /salad|fruit|veg|rice|oat|bowl|meal|breakfast|lunch|dinner/.test(text);
  const suggestedPoints = hydration ? 6 : protein ? 14 : wholeFood ? 12 : 8;

  return {
    detected_foods: [] as string[],
    estimated_calories: null,
    estimated_protein_g: null,
    estimated_carbs_g: null,
    estimated_fat_g: null,
    healthiness_score: protein || wholeFood ? 65 : 50,
    fuel_quality_label: protein || wholeFood ? 'solid' : 'okay',
    confidence: 0.25,
    notes: 'Basic Food Proof fallback. Configure model analysis for estimated macros.',
    suggested_points: suggestedPoints,
    warning: 'Estimated macros are not medical advice.',
    model_name: 'dialed-food-fallback-v1',
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: 'analyze-food-proof is not configured.' }, 500);
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) return json({ error: 'Unauthorized.' }, 401);

    const payload = assertPayload(await req.json());
    if (payload.user_id && payload.user_id !== authData.user.id) {
      return json({ error: 'Payload user_id does not match authenticated user.' }, 403);
    }

    const { data: entry, error: entryError } = await serviceClient
      .from('entries')
      .select('id, user_id, entry_type, activity_tag, metadata')
      .eq('id', payload.entry_id)
      .eq('user_id', authData.user.id)
      .neq('status', 'deleted')
      .maybeSingle();
    if (entryError) throw entryError;
    if (!entry) return json({ error: 'Entry not found for authenticated user.' }, 404);

    const { data: cached, error: cacheError } = await serviceClient
      .from('food_analyses')
      .select('*')
      .or(`entry_id.eq.${payload.entry_id},storage_path.eq.${payload.storage_path}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (cacheError) throw cacheError;
    if (cached) return json({ analysis: cached, cached: true });

    const providerKey = Deno.env.get('OPENAI_API_KEY') ?? Deno.env.get('FOOD_ANALYSIS_MODEL_KEY');
    const fallback = fallbackFoodAnalysis(payload.caption, String(entry.activity_tag ?? ''));
    const fallbackRow = {
      entry_id: payload.entry_id,
      user_id: authData.user.id,
      storage_path: payload.storage_path,
      ...fallback,
      notes: providerKey
        ? 'Food model provider is configured, but full analysis is staged. Returning basic fallback.'
        : fallback.notes,
    };

    const { data: inserted, error: insertError } = await serviceClient
      .from('food_analyses')
      .upsert(fallbackRow, { onConflict: 'entry_id' })
      .select('*')
      .maybeSingle();
    if (insertError) {
      return json({
        ...fallbackRow,
        status: 'fallback',
        cache_write_error: insertError.message,
      });
    }

    return json({ analysis: inserted, cached: false, status: 'fallback' });
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : 'analyze-food-proof failed.',
      },
      400,
    );
  }
});
