import type { Json } from '@/types/database';
import type { Entry, HealthMetricSnapshot, ScoreBreakdown } from '@/types/domain';

type EntryRow = {
  id: string;
  user_id: string;
  pillar: Entry['pillar'];
  source: Entry['source'];
  action_type: string;
  title: string;
  caption: string | null;
  proof_url: string | null;
  location: Json | null;
  health_snapshot: Json | null;
  client_metadata: Json;
  ai_summary: string | null;
  share_headline: string | null;
  score: number;
  max_score: number;
  confidence: number;
  score_breakdown: Json | null;
  status: Entry['status'];
  occurred_at: string;
  created_at: string;
};

function asRecord(value: Json | null): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function mapEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    userId: row.user_id,
    pillar: row.pillar,
    source: row.source,
    actionType: row.action_type,
    title: row.title,
    caption: row.caption,
    proofUrl: row.proof_url,
    location: asRecord(row.location),
    healthSnapshot: asRecord(row.health_snapshot) as HealthMetricSnapshot | null,
    clientMetadata: asRecord(row.client_metadata) ?? {},
    aiSummary: row.ai_summary,
    shareHeadline: row.share_headline,
    score: row.score,
    maxScore: row.max_score,
    confidence: row.confidence,
    scoreBreakdown: asRecord(row.score_breakdown) as ScoreBreakdown | null,
    status: row.status,
    occurredAt: row.occurred_at,
    createdAt: row.created_at,
  };
}
