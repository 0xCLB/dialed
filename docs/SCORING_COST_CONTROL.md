# Dialed Self Scoring Cost Control

Status: v1 added on 2026-06-02.

Dialed Self should feel instant and resilient in beta. AI can improve proof analysis, but the app must work without it.

## Rules

- Mobile never calls OpenAI or any model provider directly.
- API keys and service role keys live only in Supabase Edge Function secrets.
- `score-entry` is optional for beta. If it is missing, entries stay saved and show pending/basic scoring.
- `analyze-food-proof` is optional for beta. If it is missing, Food Proof shows pending analysis.
- Food analysis is cached by `entry_id` and `storage_path`.
- Do not rescore automatically on screen load.
- Do not spend another Daily Proof for a retry unless the user explicitly requests rescore later.
- Manual Notes are timeline/recap context by default, not ranked proof.
- Daily Recap can stay template-based unless AI is enabled server-side.

## Cheap Fallback Scoring

Rule scoring is always available:

- Movement: gym/workout/photo/location proof trends 20-30 points; walks/steps use lower rule-based points.
- Fuel: water earns 5-8 points; protein or a solid meal earns 10-18 points.
- Mind: reading and meditation earn 8-18 points.
- Recovery: sauna, stretch, and sleep earn 8-25 points.
- Manual Note: 0-3 personal context points max and not ranked by default.

Fallback scores can be saved on the entry metadata as `fallback_score`. Official ranked scoring remains server-owned in `entry_scores`.

## Food Proof

Food Proof is a `photo` entry with food metadata in the current schema. Product-facing scoring treats it as `food_photo`.

Flow:

1. Upload photo to `entry-photos`.
2. Create `entries` and `entry_media`.
3. Check `food_analyses` cache.
4. Call `analyze-food-proof` if deployed.
5. If unavailable, show pending or low-confidence fallback.
6. Never block the proof because macro analysis is missing.

Food macro estimates must be described as estimates and not medical advice.

## Pro Path

Pro can unlock deeper analysis later:

- richer food classification
- macro trend context
- health-data scoring depth
- advanced proof explanations
- premium Daily Recap detail

The free beta loop should still work: prove the day, get a basic score, and compete on verified proof.
