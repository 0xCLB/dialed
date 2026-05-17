import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type WellnessPillar = 'movement' | 'fuel' | 'mind' | 'recovery';
type EntrySource = 'photo' | 'manual' | 'healthkit' | 'location';

type ScorePayload = {
  source: EntrySource;
  pillar: WellnessPillar;
  actionType: string;
  title: string;
  caption?: string | null;
  proofPath?: string | null;
  healthSnapshot?: Record<string, number | string | undefined> | null;
  location?: Record<string, unknown> | null;
  occurredAt?: string;
  clientMetadata?: Record<string, unknown>;
};

type ScoreResult = {
  score: number;
  confidence: number;
  aiSummary: string;
  shareHeadline: string;
  breakdown: {
    base: number;
    proofBonus: number;
    streakBonus: number;
    healthBonus: number;
    qualityMultiplier: number;
    confidence: number;
    reasons: string[];
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const pillarActions: Record<WellnessPillar, string[]> = {
  movement: ['gym', 'walk', 'run', 'sport', 'hike', 'class'],
  fuel: ['hydration', 'protein', 'healthy_meal', 'supplements', 'groceries', 'fasting'],
  mind: ['reading', 'journaling', 'meditation', 'deep_work', 'therapy', 'learning'],
  recovery: ['sleep', 'sauna', 'stretching', 'mobility', 'rest', 'cold_plunge', 'breathwork'],
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function assertPayload(value: unknown): ScorePayload {
  const payload = value as Partial<ScorePayload>;
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid payload.');
  }
  if (!payload.pillar || !Object.keys(pillarActions).includes(payload.pillar)) {
    throw new Error('Invalid pillar.');
  }
  if (!payload.actionType || typeof payload.actionType !== 'string') {
    throw new Error('Invalid action type.');
  }
  if (!payload.title || typeof payload.title !== 'string') {
    throw new Error('Title is required.');
  }
  if (!payload.source || !['photo', 'manual', 'healthkit', 'location'].includes(payload.source)) {
    throw new Error('Invalid entry source.');
  }

  return {
    source: payload.source,
    pillar: payload.pillar,
    actionType: payload.actionType,
    title: payload.title.slice(0, 120),
    caption: payload.caption?.slice(0, 500) ?? null,
    proofPath: payload.proofPath ?? null,
    healthSnapshot: payload.healthSnapshot ?? null,
    location: payload.location ?? null,
    occurredAt: payload.occurredAt ?? new Date().toISOString(),
    clientMetadata: payload.clientMetadata ?? {},
  };
}

function deterministicScore(payload: ScorePayload): ScoreResult {
  const knownAction = pillarActions[payload.pillar].includes(payload.actionType);
  const base = knownAction ? 34 : 24;
  const proofBonus = payload.source === 'photo' && payload.proofPath ? 18 : payload.source === 'manual' ? 5 : 12;
  const health = payload.healthSnapshot ?? {};
  const healthBonus = Math.min(
    22,
    Math.round(
      Number(health.steps ?? 0) / 1200 +
        Number(health.activeEnergyKcal ?? 0) / 45 +
        Number(health.exerciseMinutes ?? 0) / 4 +
        Number(health.mindfulMinutes ?? 0) / 5 +
        Number(health.sleepMinutes ?? 0) / 80,
    ),
  );
  const qualityMultiplier = payload.caption && payload.caption.length > 24 ? 1.08 : 1;
  const raw = Math.round((base + proofBonus + healthBonus) * qualityMultiplier);
  const score = Math.max(5, Math.min(100, raw));
  const confidence = payload.source === 'photo' ? 0.82 : payload.source === 'healthkit' ? 0.9 : 0.68;

  return {
    score,
    confidence,
    aiSummary: `${payload.title} was scored as ${payload.pillar} proof with ${score} Dialed Points.`,
    shareHeadline: `${score} DP ${payload.title}`,
    breakdown: {
      base,
      proofBonus,
      streakBonus: 0,
      healthBonus,
      qualityMultiplier,
      confidence,
      reasons: [
        knownAction ? 'Action matched an approved wellness pillar.' : 'Action was scored with a conservative fallback.',
        payload.proofPath ? 'Photo proof increased confidence.' : 'No photo proof was attached.',
        healthBonus > 0 ? 'Apple Health context increased the score.' : 'No health metric bonus applied.',
      ],
    },
  };
}

async function aiEnhance(payload: ScorePayload, fallback: ScoreResult): Promise<ScoreResult> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  const model = Deno.env.get('OPENAI_SCORING_MODEL');
  if (!apiKey || !model) {
    return fallback;
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: 'system',
          content:
            'Score a wellness proof for Dialed Self. Return strict JSON only. Never exceed 100 points.',
        },
        {
          role: 'user',
          content: JSON.stringify({ payload, fallback }),
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'dialed_score',
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['score', 'confidence', 'aiSummary', 'shareHeadline', 'reasons'],
            properties: {
              score: { type: 'integer', minimum: 0, maximum: 100 },
              confidence: { type: 'number', minimum: 0, maximum: 1 },
              aiSummary: { type: 'string' },
              shareHeadline: { type: 'string' },
              reasons: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    return fallback;
  }

  const ai = await response.json();
  const text = ai.output_text;
  if (!text || typeof text !== 'string') {
    return fallback;
  }

  try {
    const parsed = JSON.parse(text);
    return {
      ...fallback,
      score: Math.max(0, Math.min(100, Number(parsed.score ?? fallback.score))),
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence ?? fallback.confidence))),
      aiSummary: String(parsed.aiSummary ?? fallback.aiSummary).slice(0, 320),
      shareHeadline: String(parsed.shareHeadline ?? fallback.shareHeadline).slice(0, 96),
      breakdown: {
        ...fallback.breakdown,
        confidence: Math.max(0, Math.min(1, Number(parsed.confidence ?? fallback.confidence))),
        reasons: Array.isArray(parsed.reasons)
          ? parsed.reasons.slice(0, 5).map(String)
          : fallback.breakdown.reasons,
      },
    };
  } catch {
    return fallback;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: 'Scoring function is not configured.' }, 500);
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const serviceClient = createClient(supabaseUrl, serviceRoleKey);
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return json({ error: 'Unauthorized.' }, 401);
    }

    const payload = assertPayload(await req.json());
    const fallback = deterministicScore(payload);
    const result = await aiEnhance(payload, fallback);

    const { data: entry, error: insertError } = await serviceClient
      .from('entries')
      .insert({
        user_id: user.id,
        pillar: payload.pillar,
        source: payload.source,
        action_type: payload.actionType,
        title: payload.title,
        caption: payload.caption,
        proof_url: payload.proofPath,
        location: payload.location,
        health_snapshot: payload.healthSnapshot,
        client_metadata: payload.clientMetadata,
        ai_summary: result.aiSummary,
        share_headline: result.shareHeadline,
        score: result.score,
        max_score: 100,
        confidence: result.confidence,
        score_breakdown: result.breakdown,
        status: 'scored',
        occurred_at: payload.occurredAt,
      })
      .select('*')
      .single();

    if (insertError) {
      return json({ error: insertError.message }, 400);
    }

    return json({
      entry: {
        id: entry.id,
        userId: entry.user_id,
        pillar: entry.pillar,
        source: entry.source,
        actionType: entry.action_type,
        title: entry.title,
        caption: entry.caption,
        proofUrl: entry.proof_url,
        location: entry.location,
        healthSnapshot: entry.health_snapshot,
        clientMetadata: entry.client_metadata,
        aiSummary: entry.ai_summary,
        shareHeadline: entry.share_headline,
        score: entry.score,
        maxScore: entry.max_score,
        confidence: entry.confidence,
        scoreBreakdown: entry.score_breakdown,
        status: entry.status,
        occurredAt: entry.occurred_at,
        createdAt: entry.created_at,
      },
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Scoring failed.' }, 400);
  }
});
