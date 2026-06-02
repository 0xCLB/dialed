# Dialed Self Next Fixes

Audit date: 2026-06-02

Launch blockers are listed first. Polish and product expansion should wait until these pass on a real iPhone.

## Top 10 Fixes

1. **Apply and smoke-test Daily Proof economy migration**
   - Priority: beta-blocking
   - Likely files:
     - `supabase/migrations/daily_proof_economy.sql`
     - `features/proofs/proofService.ts`
     - `app/(tabs)/home.tsx`
     - `app/(tabs)/check-in.tsx`
     - `app/(tabs)/capture.tsx`
   - What to verify: paste the contents of `supabase/migrations/daily_proof_economy.sql` into Supabase SQL Editor, not the path text; Free wallet initializes with 5 Proofs, Photo Proof spends 1 Proof, Manual Note spends 0 Proofs, `proof_transactions` records spend/earn/reset, out-of-Proofs state appears, and direct client writes remain blocked.

2. **Apply and smoke-test Food Analysis migration**
   - Priority: beta-blocking for Food Proof macro/healthiness beta
   - Likely files:
     - `supabase/migrations/20260602050838_food_analysis.sql`
     - `supabase/edge-functions/analyze-food-proof/index.ts`
     - `features/food/foodAnalysisService.ts`
     - `app/(tabs)/capture.tsx`
     - `app/entry/[id].tsx`
   - What to verify: paste the migration SQL contents into Supabase SQL Editor, confirm `food_analyses` is readable only by the owning authenticated user, deploy or intentionally defer `analyze-food-proof`, submit a Food Proof, and confirm the app shows cached analysis or a clear pending/setup state without calling model providers from mobile.

3. **Run the first real iPhone smoke test**
   - Priority: beta-blocking
   - Likely files:
     - `app/(auth)/onboarding.tsx`
     - `app/first-proof.tsx`
     - `app/(tabs)/check-in.tsx`
     - `app/(tabs)/capture.tsx`
     - `app/(tabs)/home.tsx`
     - `app/settings/health.tsx`
     - `app/settings/index.tsx`
   - What to verify: sign up, complete onboarding, confirm the Log Proof entry point is obvious, save Manual Note, confirm no Proof spend, create Photo Proof, create or attempt Food Proof, preview Apple Health connection, see reward, share proof, see Home update, sign out, sign back in, and confirm Settings diagnostics are clean.

4. **Retest normal public email sign-up**
   - Priority: beta-blocking
   - Likely files:
     - `features/auth/auth-service.ts`
     - `app/(auth)/sign-up.tsx`
     - `app/(auth)/login.tsx`
     - `app/(auth)/onboarding.tsx`
   - What to verify: after the Supabase email rate-limit window clears, sign-up returns a usable session when local-dev email confirmation is disabled, or clearly shows confirmation-required behavior when confirmation is enabled.

5. **Verify photo and Food Proof upload on-device**
   - Priority: beta-blocking for Capture
   - Likely files:
     - `app/(tabs)/capture.tsx`
     - `features/entries/entryService.ts`
     - `features/food/foodAnalysisService.ts`
     - `supabase/storage-policies.sql`
   - What to verify: camera permission, photo picker permission, upload path, media row, signed URL, Home thumbnail, Food Analysis card pending/cached state, and exact Settings diagnostics message if bucket/policy/storage fails.

6. **Deploy and verify scoring aggregation**
   - Priority: beta-blocking unless beta explicitly accepts pending-score mode
   - Likely files:
     - `supabase/edge-functions/score-entry/index.ts`
     - `features/scoring/scoringService.ts`
     - `features/scoring/types.ts`
     - `features/entries/entryService.ts`
     - `features/progress/progressService.ts`
   - What to verify: `score-entry` writes `entry_scores`, applies verification trust metadata, classifies general Photo Proof, excludes Manual Notes from ranked score by default, updates entry status, updates or triggers `daily_scores`, and keeps streak data current.

7. **Real-device Apple Health sync QA**
   - Priority: beta-blocking for Health Proof claims
   - Likely files:
     - `app/settings/health.tsx`
     - `features/health/appleHealthService.ts`
     - `features/health/healthService.ts`
     - `features/health/healthScoringService.ts`
   - What to verify: iOS development build with HealthKit capability can authorize Apple Health, sync steps/workouts/active energy/mindfulness/sleep where available, and show clear unavailable copy in Expo Go, simulator, and web.

8. **Two-user social and leaderboard QA**
   - Priority: launch-blocking for social beta
   - Likely files:
     - `features/social/socialService.ts`
     - `features/leaderboard/leaderboardService.ts`
     - `app/friends/index.tsx`
     - `app/friends/[id].tsx`
     - `app/(tabs)/leaderboard.tsx`
   - What to verify: search, request, accept, remove, visible friend profile, private entry hiding, reactions, and friends leaderboard rows.

9. **Clean stale phone/Twilio-first docs**
   - Priority: setup-blocking
   - Likely files:
     - `README.md`
     - `docs/SUPABASE_MANUAL_STEPS.md`
     - `docs/ENVIRONMENT.md`
     - `docs/PRD.md`
   - What to fix: make email/password the active dev/staging auth path everywhere, with phone OTP/Twilio and Apple Sign-In documented as future production paths.

10. **Generate Supabase TypeScript database types**
   - Priority: safety
   - Likely files:
     - `types/supabase.ts` or `types/database.ts`
     - `lib/supabase.ts`
     - feature services that call `.from(...)`
   - What to fix: type the Supabase client so bad column writes are compile-time failures instead of runtime surprises.
