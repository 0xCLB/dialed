# Dialed Self Next Fixes

Audit date: 2026-06-02

## Top 10 Fixes

1. **Apply and smoke-test Daily Proof economy migration**
   - Priority: beta-blocking
   - Likely files:
     - `supabase/migrations/daily_proof_economy.sql`
     - `features/proofs/proofService.ts`
     - `app/(tabs)/home.tsx`
     - `app/(tabs)/check-in.tsx`
     - `app/(tabs)/capture.tsx`
   - What to verify: Free wallet initializes with 5 Proofs, manual/photo entries spend 1 Proof, `proof_transactions` records spend/earn/reset, out-of-Proofs state appears, and direct client writes remain blocked.

2. **Retest normal public email sign-up**
   - Priority: beta-blocking
   - Likely files:
     - `features/auth/auth-service.ts`
     - `app/(auth)/sign-up.tsx`
     - `app/(auth)/login.tsx`
     - `app/(auth)/onboarding.tsx`
   - What to verify: after the Supabase email rate-limit window clears, sign-up returns a usable session when local-dev email confirmation is disabled, or clearly shows confirmation-required behavior when confirmation is enabled.

3. **Deploy and verify scoring aggregation**
   - Priority: beta-blocking unless beta explicitly accepts pending-score mode
   - Likely files:
     - `supabase/edge-functions/score-entry/index.ts`
     - `features/scoring/scoringService.ts`
     - `features/entries/entryService.ts`
     - `features/progress/progressService.ts`
   - What to verify: `score-entry` writes `entry_scores`, updates entry status, updates or triggers `daily_scores`, and keeps streak data current.

4. **Real-device first-session smoke**
   - Priority: beta-blocking
   - Likely files:
     - `app/(auth)/sign-up.tsx`
     - `app/(auth)/onboarding.tsx`
     - `app/first-proof.tsx`
     - `app/(tabs)/check-in.tsx`
     - `components/entries/SubmitSuccessCard.tsx`
   - What to verify: install a dev build, sign up, complete onboarding, choose first proof, create a quick check-in, see reward, land on Home, sign out, and sign back in.

5. **Photo proof device QA**
   - Priority: beta-blocking for Capture
   - Likely files:
     - `app/(tabs)/capture.tsx`
     - `features/entries/entryService.ts`
     - `supabase/storage-policies.sql`
   - What to verify: camera permission, photo picker permission, upload path, media row, signed URL, Home thumbnail, and graceful failure if permission/storage fails.

6. **Two-user social and leaderboard QA**
   - Priority: launch-blocking for social beta
   - Likely files:
     - `features/social/socialService.ts`
     - `features/leaderboard/leaderboardService.ts`
     - `app/friends/index.tsx`
     - `app/friends/[id].tsx`
     - `app/(tabs)/leaderboard.tsx`
   - What to verify: search, request, accept, remove, visible friend profile, private entry hiding, reactions, and friends leaderboard rows.

7. **Clean stale phone/Twilio-first docs**
   - Priority: setup-blocking
   - Likely files:
     - `README.md`
     - `docs/SUPABASE_MANUAL_STEPS.md`
     - `docs/ENVIRONMENT.md`
     - `docs/PRD.md`
   - What to fix: make email/password the active dev/staging auth path everywhere, with phone OTP/Twilio and Apple Sign-In documented as future production paths.

8. **Generate Supabase TypeScript database types**
   - Priority: safety
   - Likely files:
     - `types/supabase.ts` or `types/database.ts`
     - `lib/supabase.ts`
     - feature services that call `.from(...)`
   - What to fix: type the Supabase client so bad column writes are compile-time failures instead of runtime surprises.

9. **RevenueCat webhook and Pro ownership**
   - Priority: monetization-blocking
   - Likely files:
     - `supabase/edge-functions/sync-revenuecat-webhook/index.ts`
     - `features/monetization/proService.ts`
     - `features/monetization/usePro.ts`
     - `lib/revenuecat.ts`
   - What to verify: purchase/restore updates RevenueCat, webhook writes `subscriptions` and `subscription_events`, app reads Pro status, and client writes remain blocked.

10. **Expo version alignment decision**
    - Priority: setup-polish
    - Likely files:
      - `AGENTS.md`
      - `package.json`
      - `package-lock.json`
      - `README.md`
    - What to decide: keep Expo SDK 55 and update repo instructions/docs, or intentionally align package versions and implementation docs to SDK 54.
