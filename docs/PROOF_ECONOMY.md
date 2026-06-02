# Dialed Self Proof Economy

Status: v1 app/migration implementation added on 2026-06-01. Verification-first policy added on 2026-06-02. Elite data layer update added on 2026-06-02.

Daily Proofs make Dialed Self feel like a game instead of unlimited health tracking. A Proof is one verified scoring attempt. Proofs should come from photo classification, location check-in, quantitative health data, or a hybrid of those signals.

Primary rule: Proof > promises.

Manual self-reporting exists as a note/context layer. Manual Notes can help a timeline, digest, or memory of the day, but they do not meaningfully affect ranked leaderboard score by default.

## Proof Types

- Photo Proof: user captures or uploads a photo. Server classification evaluates the wellness action, such as gym, meal, hydration, reading, sauna, stretching, or outdoor activity.
- Food Proof: a Photo Proof subtype for Fuel. The server may estimate macros, detect likely foods, and assign a Fuel quality label. These are product estimates for Dialed scoring, not medical or nutrition advice.
- Location Proof: user checks in at a relevant wellness place, such as gym, studio, trail, beach, sauna, grocery, or park. Location should be privacy-safe and rough by default.
- Health Proof: Apple Health or wearable metrics, including steps, workouts, sleep, mindfulness, calories, and later HR/HRV.
- Hybrid Proof: combines signals, such as photo plus location, photo plus HealthKit, or location plus HealthKit.
- Manual Note: user-entered activity/caption used for context. Stored under the current database-compatible `manual` entry type with `metadata.proof_type = manual_note`.

## Trust Weights

- `verified_health`: 1.00
- `photo_location`: 0.95
- photo classification: 0.85
- `location_only`: 0.65
- `manual_note`: 0.15

Manual Notes should be excluded from ranked score by default. If future scoring is explicitly requested for a Manual Note, cap personal context points at 0-3 and keep `ranked_eligible = false`.

## Food Proof And Macro Analysis

Food Proof is cost-controlled and edge-function-first:

- The mobile app uploads the photo and creates the entry/media rows.
- The mobile app never calls OpenAI or any model provider directly.
- The app first checks the `food_analyses` cache by `entry_id` and storage path.
- If no cached analysis exists, the app calls the `analyze-food-proof` Supabase Edge Function.
- If the table or function is missing, the app shows a pending/setup state instead of blocking the proof.
- Macro estimates, healthiness scores, and Fuel quality labels are server-owned rows in `food_analyses`.
- User-facing copy must say estimates are not medical advice.

Food Analysis database support lives in:

```text
supabase/migrations/20260602050838_food_analysis.sql
```

The migration creates `food_analyses`, enables RLS, allows authenticated users to read only their own rows, and keeps direct client writes blocked. Apply the SQL contents in Supabase SQL Editor, not the filename.

Scoring app support lives in:

```text
features/scoring/types.ts
features/scoring/scoringService.ts
features/scoring/foodAnalysisService.ts
components/scoring/
```

General Photo Proof uses deterministic beta scoring until server classification is live. Food Proof uses cached `food_analyses` rows first, then the Edge Function, then a pending/low-confidence fallback. Official ranked scores remain server-owned in `entry_scores`.

## Health Proof Scoring

Apple Health beta scoring is deterministic and cheap:

- Steps: 5,000 steps = 10 points, 8,000 steps = 15 points, 10,000 steps = 20 points.
- Workouts: 15 minutes = 15 points, 30 minutes = 25 points, 60 minutes = 35 points.
- Mindfulness: 5 minutes = 8 points, 10 minutes = 12 points, 20 minutes = 20 points.
- Sleep: 7 hours = 20 points.

Apple Health requires a real iPhone development or production build with HealthKit enabled. Expo Go, web, and simulator can preview the settings UI but should not claim live HealthKit reads.

External wearable providers are stubs only in v1: Fitbit, Oura, Garmin, WHOOP, and Strava are documented as planned integrations.

## Allowance

- Free: 5 base Daily Proofs.
- Pro: 20 base Daily Proofs.
- Free bonus cap: +3 earned Proofs per day.
- Pro bonus cap: +5 earned Proofs per day in v1 so Pro has extra capacity without making competition pointless.

## Database

Apply in Supabase SQL Editor by opening the file and pasting the SQL contents:

```text
supabase/migrations/daily_proof_economy.sql
```

Do not paste only the path above into SQL Editor. It is a filename, not SQL.

The migration creates:

- `proof_wallets`
- `proof_transactions`
- RLS read policies for each user to read only their own Proof data
- RPC write paths:
  - `initialize_today_proof_wallet(date)`
  - `spend_proof_for_entry(uuid)`
  - `earn_bonus_proof(text, date, jsonb)`
  - `refund_proof_for_entry(uuid, text)`

Wallets use `(user_id, proof_date)` as the primary key so tomorrow bonuses and historical transactions can coexist. The prompt’s one-row `user_id primary key` shape would overwrite tomorrow rewards, so the migration uses the daily key that matches the product rule.

Client table writes are not opened broadly. The app reads wallets/transactions and spends/earns/refunds through RPC functions that check `auth.uid()`.

## App Flow

1. Home initializes/fetches today’s wallet and shows remaining Daily Proofs.
2. Quick Proof lets the user pick an activity starter, then choose Add Photo, Food Photo, Add Location, Use Health Data, or Save as Manual Note.
3. Photo Proof, Food Proof, and future Location/Hybrid score attempts open a “Use a Proof” modal.
4. The verified entry is created first.
5. The app calls `spend_proof_for_entry(entry_id)`.
6. Scoring is requested after the Proof is spent.
7. If scoring is missing or fails, the verified entry remains pending and the Proof stays spent.
8. If entry creation/upload fails, no Proof is spent.
9. Manual Notes save with `proof_consumption = free`, `score_requested = false`, and `ranked_eligible = false`.

If the migration has not been applied, the app shows a setup-required state and blocks Proof spending instead of pretending the economy is enforced.

## Earned Proofs

Implemented v1 hooks:

- +1 today for a successful share-card export, max once/day.
- +1 tomorrow for a Fully Dialed Day.
- +1 tomorrow for a 3-day streak.

Placeholder:

- +1 for inviting a friend who signs up. Referral/invite attribution is not built yet.

## Ranked Fairness

Personal progress can use all saved proofs. Ranked daily competition should only count a capped number of ranked proofs:

- Free ranked cap: top 5 ranked proofs/day.
- Pro ranked cap: top 10 ranked proofs/day.

This prevents Pro from becoming “20 proofs beats 5 proofs” by default. Extra Pro Proofs still matter for personal progress, photos, automation, digest quality, and premium status, but leaderboard scoring should aggregate only the top ranked subset once server aggregation is implemented.

Current placeholder logic lives in `features/proofs/proofService.ts` as `RANKED_PROOF_CAPS` and `getRankedProofCap(tier)`. Server aggregation still needs to apply the caps when `daily_scores` is recalculated.

Server aggregation must also apply trust weighting:

- verified health and hybrid proof can carry full/high confidence.
- photo classification proof should count strongly but below hybrid.
- location-only proof should count, but at lower confidence.
- manual notes should be excluded from ranked score unless a future explicit scoring mode adds capped personal context points.

Future Fuel scoring can enrich Photo Proof through macro/meal classification, but should remain framed as product scoring, not diet or medical diagnosis.

## Manual Supabase Setup

After review, paste the contents of `supabase/migrations/daily_proof_economy.sql` in Supabase SQL Editor or apply it through the project migration flow.

Because newer Supabase projects may not expose new tables to the Data API automatically, verify:

- `proof_wallets` is exposed/readable to `authenticated`.
- `proof_transactions` is exposed/readable to `authenticated`.
- RLS is enabled on both tables.
- RPC functions are executable by `authenticated`.
- Client insert/update/delete remains blocked for both tables.

For Food Proof analysis, also apply:

```text
supabase/migrations/20260602050838_food_analysis.sql
```

Verify:

- `food_analyses` is exposed/readable to `authenticated`.
- RLS is enabled.
- Users can read only rows where `food_analyses.user_id = auth.uid()`.
- Direct client insert/update/delete remains blocked.
- `analyze-food-proof` is deployed only when server-side model/provider secrets are configured.
- If `analyze-food-proof` is not deployed, the app shows pending Food Analysis copy and still saves the proof.

## Test Plan

1. Login.
2. Complete onboarding.
3. Open Home and confirm the Daily Proof card appears.
4. Start Quick Proof and choose Add Photo.
5. Create a photo proof and confirm remaining Proofs decreases.
6. Create a Food Proof and confirm the Food Analysis card shows cached estimates or pending/setup copy.
7. Start Quick Proof and choose Save as Manual Note.
8. Confirm the Manual Note appears on Home as context only and remaining Proofs do not decrease.
9. Spend all 5 Free Proofs with verified score attempts and confirm the out-of-Proofs state appears.
10. Share today’s score/card and confirm +1 bonus appears once.
11. Upgrade/stub Pro and confirm the wallet initializes with 20 base Proofs.
12. Confirm `proof_transactions` has spend/earn/reset rows for verified score attempts only.
13. Confirm private RLS blocks reading another user’s Proof wallet.
14. On a real iPhone development build, connect Apple Health and confirm steps/workout/mindfulness/sleep scoring follows the beta thresholds.
