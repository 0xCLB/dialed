# Dialed Self Ship Checklist

Last updated: 2026-06-02

Purpose: keep beta/TestFlight prep focused on shipping the core promise: prove your day, get your Dialed Score, beat your friends.

## Beta Readiness

- [x] Expo app compiles locally.
- [x] Current verification commands pass: `npm run typecheck`, `npx tsc --noEmit`, `npx expo install --check`, `npx expo config --type public`, `git diff --check`.
- [x] Email/password is the active development and staging auth path.
- [x] Phone OTP is deferred until Twilio is worth enabling.
- [x] Apple Sign-In is deferred until App Store/TestFlight requirements make it necessary.
- [x] Onboarding explains the product in under 10 seconds.
- [x] Onboarding has the four fast beats: Dialed Score, Daily Proofs, four pillars, friends/share.
- [x] First proof path presents Photo Proof, Food Proof, Location Proof, Health Proof, and Manual Note.
- [x] Home empty state points to Log First Proof plus Photo, Food, Health, and Location paths.
- [x] Main proof entry point is labeled Log Proof.
- [x] Manual Notes are context-only by default and do not spend Daily Proofs.
- [x] Verified proofs can show deterministic Basic scores while official scoring is pending.
- [x] Daily Recap works with template fallback when the edge function is missing.
- [x] Food Proof can save a Fuel photo proof and show cached/pending analysis without mobile model calls.
- [x] Apple Health settings explain real-device HealthKit requirements and simulator/Expo Go limitations.
- [x] Dev diagnostics are development-only and do not expose secrets.
- [x] Dev diagnostics show auth, profile, entry, storage, scoring, food analysis, HealthKit, verification, and trust state.

## Supabase

- [x] App reads `EXPO_PUBLIC_SUPABASE_URL`.
- [x] App reads `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- [x] App reads `EXPO_PUBLIC_APP_ENV`.
- [ ] Confirm Email provider is enabled in Supabase Auth.
- [ ] Confirm local dev email confirmation setting matches the test plan.
- [x] Core schema/RLS/storage docs exist in the repo.
- [ ] Apply `supabase/migrations/daily_proof_economy.sql` by pasting the SQL contents, not the filename.
- [ ] Verify `proof_wallets` and `proof_transactions` are readable only by the owning authenticated user.
- [ ] Verify Proof RPC functions are executable by authenticated users.
- [ ] Apply `supabase/migrations/20260602050838_food_analysis.sql` by pasting the SQL contents, not the filename.
- [ ] Verify `food_analyses` is readable only by the owning authenticated user.
- [ ] Verify buckets exist: `entry-photos`, `share-assets`, `avatars`.
- [ ] Verify storage object policies match user folder paths.
- [ ] Verify no service role or secret key is present in app env.

## Scoring And Cost Control

- [x] Mobile app does not call model providers directly.
- [x] `score-entry` is optional for beta; missing function leaves entries pending/basic instead of crashing.
- [x] Official scores remain server-owned in `entry_scores`.
- [x] Basic scoring is deterministic and display-only.
- [x] Food Analysis checks cached server rows and falls back to pending/setup copy when the Edge Function is missing.
- [x] Manual Notes are capped at context-only behavior by default.
- [ ] Deploy `score-entry` when server scoring is ready.
- [ ] Deploy `analyze-food-proof` when Food Proof macro/healthiness output is ready.
- [ ] Configure server-only function secrets only in Supabase.
- [ ] Confirm scoring cache/update behavior after `score-entry` deployment.

## Real Device Smoke

- [ ] iPhone/simulator smoke: app boots cleanly.
- [ ] Sign up with email/password.
- [ ] Complete onboarding.
- [ ] Land on Home.
- [ ] Create Photo Proof or Quick Proof.
- [ ] Create Food Proof and confirm cached estimate or pending analysis state.
- [ ] Confirm Daily Proof count decreases for verified proof.
- [ ] Save Manual Note and confirm Daily Proof count does not decrease.
- [ ] Connect/sync Apple Health on a real iPhone development build, or confirm unavailable copy on simulator/Expo Go.
- [ ] Confirm new entry appears on Home.
- [ ] Attempt photo upload and confirm success or exact storage error.
- [ ] Sign out.
- [ ] Sign back in and confirm session persists.

## TestFlight Prep Remaining

- [ ] App icon final review. Placeholder assets exist, but final brand QA is still needed.
- [ ] Splash screen final review. Placeholder assets exist, but final brand QA is still needed.
- [ ] Privacy policy URL.
- [ ] Terms URL.
- [ ] App Store privacy nutrition details.
- [ ] Production Supabase project/env decision.
- [ ] EAS project/build profile review.
- [ ] TestFlight build from clean machine or CI.
- [ ] RevenueCat products/offerings if paid beta is desired.
- [ ] Apple Sign-In review if App Store policy requires it for the final auth mix.
- [ ] Real iPhone smoke test after Daily Proof and Food Analysis migrations are applied.
- [ ] HealthKit real-device validation with development build entitlement.

## Deferred

- [ ] RevenueCat can remain optional/deferred for beta if offerings are not ready.
- [ ] Twilio/Phone OTP deferred.
- [ ] Apple Sign-In deferred unless required later.
- [ ] Full video reels export deferred.
- [ ] Full challenge/comment systems deferred.
