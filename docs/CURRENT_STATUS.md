# Dialed Self Current Status

Audit date: 2026-06-01
Beta readiness update: 2026-06-02
Real-device smoke hardening update: 2026-06-02
Verification-first Daily Proof update: 2026-06-02
Ship-readiness simplification update: 2026-06-02
Elite data layer update: 2026-06-02
Scoring Engine + Food/Photo Analysis update: 2026-06-02
Elite Flow + TestFlight Polish update: 2026-06-02

Scope: full repo/build audit plus real Supabase end-to-end smoke test for the connected project, followed by Daily Proof Economy v1, First-Session Activation/Core Loop Polish v1, Beta Readiness QA v1, ship-readiness simplification, and Elite Data Layer v1.

Beta verdict: ready for the first real iPhone smoke test after the Daily Proof migration is applied correctly. Not ready for TestFlight prep yet; the connected Supabase project still needs the Proof migration smoke-tested, normal public email sign-up retested, Food Analysis migration/edge-function smoke-tested, and `score-entry` deployed or intentionally accepted as pending-score beta behavior. The app now follows the verification-first rule: Proof > promises.

## ✅ Working

- Repo is a real Expo Router / React Native app with app code, backend SQL docs, Edge Function stubs, UI components, and feature modules.
- TypeScript and Expo dependency verification pass:
  - `npm run typecheck`
  - `npx tsc --noEmit`
  - `npx expo install --check`
  - `npx expo config --type public`
- `package.json` has the expected Expo scripts: `start`, `ios`, `android`, `web`, and `typecheck`.
- App config resolves through `app.config.ts`; it defines bundle/package IDs, camera/photo/location permission copy, Expo Router, notifications, sharing, web browser, and HealthKit plugin config.
- TypeScript strict mode is enabled through `tsconfig.json`, with the `@/*` path alias and Edge Functions excluded from mobile app typechecking.
- Supabase client is Expo-native:
  - Uses `@supabase/supabase-js`.
  - Uses `@react-native-async-storage/async-storage` for native session persistence.
  - Uses web-safe storage for web/SSR-safe rendering.
  - Uses `persistSession: true`, `autoRefreshToken: true`, and `detectSessionInUrl: false`.
- Env wiring uses public Expo variables only:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - `EXPO_PUBLIC_REVENUECAT_API_KEY`
  - `EXPO_PUBLIC_APP_ENV`
- No `.env` file is committed. `.gitignore` now ignores `.env` and `.env.*` while keeping `.env.example` trackable.
- No Next.js auth helpers or SSR Supabase clients are used in app code.
- Supabase backend blueprint files exist:
  - `supabase/schema.sql`
  - `supabase/policies.sql`
  - `supabase/storage-policies.sql`
  - `supabase/storage-notes.md`
  - `supabase/seed.sql`
  - Edge Function stubs for scoring, digest, share card, smart notification, and RevenueCat sync.
- Active dev/staging auth is email/password:
  - `app/(auth)/login.tsx`
  - `app/(auth)/sign-up.tsx`
  - `features/auth/auth-service.ts`
  - `features/auth/auth-store.ts`
- Auth screen copy now states the core promise: "Prove your day. Get your Dialed Score. Beat your friends."
- Phone OTP and Apple Sign-In are future stubs, not required for development testing.
- Auth session bootstrap and route protection exist:
  - `features/auth/AuthProvider.tsx`
  - `features/auth/useAuth.ts`
  - `features/auth/useRequireSession.ts`
  - `app/(tabs)/_layout.tsx`
- Profile creation uses the real Supabase auth user id:
  - `profiles.id` references `auth.users(id)` in `supabase/schema.sql`.
  - `ensureProfileForUser(user)` inserts `profiles.id = user.id`.
  - onboarding upserts with `id = session.user.id`.
- First-session activation flow exists:
  - onboarding is now a short four-step flow: product promise, verification-first proof, points, and friends/share with identity capture
  - onboarding completion routes to `/first-proof`
  - `/first-proof` offers Photo Proof, Location Proof, Health Proof, and Manual Note paths
  - Photo Proof and Quick Proof are the easiest first actions
- Sign out exists in Profile/Settings and clears the Supabase session.
- Settings private profile toggle now updates the schema-backed `privacy_default` column instead of a non-existent `is_private` field.
- Missing Supabase env now renders a clear development error screen instead of crashing during Supabase client import.
- Settings includes a development-only diagnostics card with current user id, profile id/onboarding status, Supabase configured state, storage smoke note, Proof wallet state, last auth error, last profile error, last entry insert error, last storage upload error, last verification method, scoring trust/confidence, and last scoring error. It does not display secrets.
- Core loop screens exist:
  - Home / My Day: `app/(tabs)/home.tsx`
  - Quick Proof: `app/(tabs)/check-in.tsx`
  - Photo Capture: `app/(tabs)/capture.tsx`
  - Entry Detail: `app/entry/[id].tsx`
- Entry creation uses authenticated user ownership checks before insert. `createManualEntry`, `createPhotoEntry`, and `uploadEntryPhoto` reject mismatched user ids.
- Entry creation now uses real client-generated UUIDs plus minimal inserts, then fetches created rows in a separate query. This avoids the current Supabase RLS failure caused by `insert().select()` on `entries`.
- Entries insert with `status = 'pending_score'`, call `score-entry`, and safely show pending state when scoring is unavailable.
- Verified proofs without an official `entry_scores` row now display a deterministic Basic score for beta while keeping official scoring server-owned.
- Photo proof storage path matches the intended shape: `entry-photos/{user_id}/{entry_id}/{media_id}.jpg|png`.
- Verification-first Daily Proof policy is app-implemented:
  - Photo Proof uses `proof_type = photo`, `verification_method = photo`, photo-classification trust metadata, and is ranked eligible.
  - Health Proof uses `proof_type = health`, `verification_method = health`, `trust_level = verified_health`, and is ranked eligible.
  - Hybrid and Location Proof types are represented in app types/policy helpers for future implementation.
  - Manual-only text is stored as a Manual Note using database-compatible `entry_type = manual` plus `metadata.proof_type = manual_note`.
  - Manual Notes save timeline context, do not spend Daily Proofs, do not request scoring by default, and are not ranked eligible.
  - Existing database `manual` rows map to `manual_note` in the app layer.
- Daily Proof Economy v1 app code exists:
  - `supabase/migrations/daily_proof_economy.sql`
  - `features/proofs/proofService.ts`
  - proof balance/spend/earn/upgrade UI components
  - Home Proof balance/card
  - Check-In and Capture Proof confirmation modal
  - Proof spend after successful entry creation and before scoring
  - share-card export bonus hook
- Elite Data Layer v1 app code exists:
  - Apple Health connection state now distinguishes synced/available/unavailable and explains that Expo Go/simulator cannot read HealthKit data.
  - Apple Health scoring uses deterministic beta thresholds: steps at 5k/8k/10k, workouts at 15/30/60 minutes, mindfulness at 5/10/20 minutes, and sleep at 7 hours.
  - External wearables are intentionally stubbed: Fitbit, Oura, Garmin, WHOOP, and Strava show planned status only.
  - Food Proof mode exists in Capture with Fuel defaults, explicit estimated-macros disclaimer, and no direct model calls from the mobile app.
  - Food Proof analysis service checks cached `food_analyses` rows first, then calls the `analyze-food-proof` Edge Function when deployed, and otherwise shows a pending/setup state.
  - Profile now shows connected data sources for Apple Health, Food Proof, and planned wearables.
  - Pro onboarding/paywall copy introduces advanced food analysis and health insights as future expanded power, not beta requirements.
- Scoring Engine + Food/Photo Analysis v1 exists:
  - `features/scoring/types.ts` defines proof type, trust level, scoring status/source, score result, and food-analysis result types.
  - `features/scoring/scoringService.ts` now exposes proof-specific scoring helpers for photo, food photo, location, health, hybrid, and manual notes.
  - `features/scoring/foodAnalysisService.ts` wraps `analyze-food-proof`, checks cached analysis, and falls back safely when the function is missing.
  - `components/scoring/*` adds score result, trust, proof type, macro, fuel quality, pending-analysis, and explanation-sheet UI.
  - Entry Detail now uses the scoring result card so users see proof type, trust level, pillar, points, confidence, explanation, and ranked eligibility.
  - Fallback scores can be saved in entry metadata as `fallback_score`; official ranked scores remain server-owned in `entry_scores`.
  - `docs/SCORING_COST_CONTROL.md` documents no mobile AI calls, cache-first analysis, deterministic fallback rules, and Pro/deeper-analysis boundaries.
- Elite Flow + TestFlight Polish v1 exists:
  - onboarding copy now follows the four fast beats: Dialed Score, Daily Proofs, four pillars, friends/share
  - the first proof chooser includes Photo Proof, Food Proof, Location Proof, Health Proof, and Manual Note
  - the main proof tab is labeled Log Proof
  - Home empty state now shows Log First Proof plus Photo, Food, Health, and Location sub-actions
  - reward cards use clearer “Log another” copy instead of a dead-end “Later”
  - development diagnostics now separate food-analysis and HealthKit failures from generic scoring failures
  - share cards retain status-symbol language with “Proof > promises” and “Get Dialed”
- Core loop polish exists:
  - Home top hierarchy shows Dialed Score, Wellness Ring, Daily Proofs, and next best action
  - Check-In/Capture require intentional "Use a Proof" confirmation
  - Entry success card shows points/pending, pillar, Proof spent, Proofs remaining, share CTA, and View Today CTA
  - empty states push first proof, friends, and leaderboard actions
  - paywall copy frames Pro as more capacity, deeper scoring, better artifacts, and fair competition
- Ship-readiness simplification exists:
  - user-facing internal recap branding was removed
  - Daily Recap is the active user-facing recap language
  - verified proofs can show Basic scoring without requiring a live scoring function
  - Manual Notes are clearly framed as timeline/recap context, not ranked proof
- Beta QA stabilization added:
  - scoring failures are recorded for development diagnostics
  - auth/profile failures are recorded for development diagnostics
  - entry insert/proof-spend failures are recorded for development diagnostics
  - storage upload failures are recorded separately for development diagnostics
  - verification method and scoring trust/confidence are recorded for development diagnostics
  - Check-In and Capture surface Proof wallet lookup failures instead of silently failing
  - Home reloads when the tab regains focus, so entries created from Check-In/Capture appear after returning to My Day
  - out-of-Proofs modal copy now explains tomorrow/Pro/share paths
  - static route audit found no missing route files for the core loop
- Home fetches today's entries, daily score, streak, health summary, digest preview, and friend feed without requiring any fake UUIDs.
- Local Home/Profile progress derivation excludes Manual Notes from verified pillar totals and can use Basic fallback points for pending verified proofs.
- Leaderboard copy now states that ranked score favors verified proof. Server aggregation still needs to enforce trust weighting when `daily_scores` is recalculated.
- Progress layer exists:
  - daily points
  - pillar progress / wellness ring
  - Fully Dialed state
  - streak card
  - profile stats
  - timeline day screen
- Social/viral layer exists:
  - Friends screen
  - Friend profile screen
  - Reactions
  - Friends leaderboard
  - Share cards
  - Reels From My Day preview/export cover flow
  - Daily Recap screen and fallback generator
  - Notifications inbox/settings and local-dev fallback
- Monetization/health layer exists:
  - RevenueCat setup wrapper and paywall
  - Pro gates/placeholders
  - Apple Health settings/sync surface
  - other wearable providers are stubs/placeholders.
- Remote Supabase smoke test previously passed for the patched app-shaped path:
  - confirmed test user sign-in with public client
  - profile insert
  - onboarding profile update
  - manual entry insert with real `user_id`
  - Home-style entry query
  - photo entry insert
  - entry media row insert
  - private `entry-photos` upload
  - signed photo URL creation
  - smoke storage object cleanup
  - sign out
  - sign back in
  - smoke auth user cleanup
  - a separate true photo-proof smoke confirmed `entry_type = photo`, media row creation, upload, signed URL generation, and cleanup
- Current code verification passed after real-device smoke hardening:
  - `npm run typecheck`
  - `npx tsc --noEmit`

## Remote Supabase Checklist

- ✅ Project URL: connected to `https://yifbscfdazoqqzxxzeaj.supabase.co`.
- ✅ `pgcrypto` extension exists.
- ✅ Core public tables exist and have RLS enabled, including `profiles`, `entries`, `entry_media`, `entry_scores`, `daily_scores`, `streaks`, `friendships`, `reactions`, `daily_digests`, `share_assets`, `notification_devices`, `notification_preferences`, `notifications`, and `subscriptions`.
- ✅ Storage buckets exist:
  - `entry-photos` private
  - `share-assets` private
  - `avatars` public
- ✅ Storage object policies exist for entry photos, share assets, and avatars.
- ✅ `profiles.id` is a foreign key to `auth.users(id)`.
- ✅ Authenticated profile insert/update works for a real auth user.
- ✅ Authenticated entry insert works with minimal insert and separate fetch.
- ✅ Authenticated storage upload and signed URL flow works for `entry-photos`.
- ⚠️ Daily Proof Economy migration file exists locally, but the connected Supabase project still needs the migration applied and smoke-tested.
- ⚠️ In Supabase SQL Editor, paste the contents of `supabase/migrations/daily_proof_economy.sql`. Do not paste the filename/path; `supabase/migrations/daily_proof_economy.sql` by itself is not SQL and will fail with a syntax error.
- ⚠️ Food Analysis migration file exists locally at `supabase/migrations/20260602050838_food_analysis.sql`, but the connected Supabase project still needs it applied and smoke-tested.
- ⚠️ Public email sign-up reached Supabase Auth, but the smoke attempts hit provider validation/rate limiting. Retest normal app sign-up after the email rate-limit window clears.
- ❌ No Edge Functions are deployed in the connected project right now. `score-entry` returns 404, and `analyze-food-proof` is expected to be fallback/pending until deployed.
- ⚠️ Server secrets for Edge Functions were not verified from this app smoke. Configure them before function deployment.

## ⚠️ Partially Working

- Local `.env` is not committed. On this machine, an ignored local `.env` now provides Supabase URL, Supabase anon key, and `EXPO_PUBLIC_APP_ENV=development`; RevenueCat remains unset unless added locally.
- Public sign-up is temporarily blocked by Supabase email rate limiting from smoke attempts. Public sign-in works for a confirmed user.
- Edge Functions are Edge-Function-first in the app, but production behavior depends on deployment and secrets:
  - `score-entry`
  - `generate-digest`
  - `create-share-card`
  - `send-smart-notification`
  - `sync-revenuecat-webhook`
- Server-owned scoring is not live because `score-entry` is not deployed. The app preserves entries in pending state when scoring fails.
- `daily_scores` and `streaks` are read if available; otherwise the app derives local day/progress/streak display from visible entries and scores.
- Daily Recap works with local fallback templates when `generate-digest` is missing or client writes to `daily_digests` are blocked.
- Notifications can render inbox/preferences and schedule dev fallback notifications, but production push delivery needs Expo push credentials plus the deployed smart notification function.
- Share cards and reels export captured images/cover assets. True MP4 story/reel rendering is not implemented.
- RevenueCat Pro flow has paywall, packages, purchase/restore calls, CustomerInfo fallback, and gates. Live purchases require RevenueCat dashboard products, offerings, entitlement, and webhook deployment.
- Apple Health requires an iOS development/production build with HealthKit capability. It will not work in Expo Go, web, or simulator for real HealthKit reads.
- Food Proof Capture and analysis UI exist, but macro/healthiness output is pending or low-confidence fallback until `food_analyses` is migrated and `analyze-food-proof` writes server-owned results. The mobile app never calls model providers directly.
- Friends, leaderboard, reactions, and privacy behavior depend on Supabase RLS and at least two real test users.
- Daily Proof Economy v1 is built in app code, but remote Supabase migration application and real-device QA are still pending. Until applied, the app shows setup-required Proof states instead of silently faking spends. Manual Notes remain free/context-only.
- First-session activation flow is app-implemented but still needs a real sign-up/onboarding/first-proof device smoke after public email sign-up rate limiting clears.
- Comments, full challenges, Apple Sign-In, phone OTP, Twilio, and real invite/referral codes are not built.
- README and some older Supabase setup docs still contain phone/Twilio-first wording even though active dev auth is now email/password.
- The repo instruction says to read Expo SDK 54 docs before code edits, but `package.json` is currently on Expo SDK 55. The app verifies against installed Expo 55 dependencies.

## ❌ Broken/Missing

- Daily Proof Economy v1 is not proven end to end against the connected remote database until `supabase/migrations/daily_proof_economy.sql` is applied and tested.
- Food Analysis is not proven end to end against the connected remote database until `supabase/migrations/20260602050838_food_analysis.sql` is applied and `analyze-food-proof` is deployed/configured or explicitly accepted as pending-only beta behavior.
- First-proof reward can show pending scoring instead of points until `score-entry` is deployed.
- Server-owned score aggregation is not proven end to end. Without deployed scoring/aggregation, the core promise can remain at "proof saved/scoring" instead of "Get your Dialed Score."
- Full photo classification is not live yet. General Photo Proof uses deterministic beta scoring until `score-entry` classifies proof server-side.
- Full friend competition is not proven until at least two users can sign up, complete onboarding, create scored entries, friend each other, and appear on the leaderboard.
- Public email sign-up needs a clean retest after the rate-limit window clears.
- Phone OTP is intentionally disabled for dev until Twilio is ready.
- Apple Sign-In is not implemented.
- Full comments and challenge flows are not implemented in app screens.
- Production-safe profile aggregate/all-time stats are missing; Profile currently relies on fetched recent `daily_scores`.
- Real digest/reel/share-card archive management is not complete.
- The app has many feature surfaces, but several are placeholder-gated and need device QA before TestFlight.

## 🚧 Manual Setup Needed

- Create local `.env` from `.env.example`:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - `EXPO_PUBLIC_REVENUECAT_API_KEY`
  - `EXPO_PUBLIC_APP_ENV=development`
- In Supabase Auth:
  - Email provider appears reachable, but public sign-up needs retesting after rate limiting clears.
  - For local dev only, disable email confirmation if immediate sign-up/onboarding is desired.
  - Keep Phone Auth/Twilio deferred until production SMS is worth paying for.
- In Supabase SQL/Storage:
  - Tables, RLS, buckets, and storage policies were verified by smoke/audit.
  - Apply the contents of `supabase/migrations/daily_proof_economy.sql` in SQL Editor, not the path text.
  - Verify `proof_wallets`, `proof_transactions`, and Proof RPC functions are exposed/executable for `authenticated` while direct client writes remain blocked.
  - Apply the contents of `supabase/migrations/20260602050838_food_analysis.sql` in SQL Editor, not the path text.
  - Verify `food_analyses` is readable only by the owning authenticated user and direct client writes remain blocked.
  - Keep a manual SQL review process before future schema changes.
  - Regenerate typed Supabase database types after schema is finalized.
- In Supabase Edge Functions:
  - Configure server-only secrets in Supabase, not Expo env:
    - `OPENAI_API_KEY`
    - `OPENAI_SCORING_MODEL`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `REVENUECAT_WEBHOOK_AUTH`
    - `DIALED_INTERNAL_FUNCTION_TOKEN`
  - Deploy and smoke-test all required functions, including `analyze-food-proof` when Food Proof macro analysis is ready.
- In RevenueCat:
  - Configure products.
  - Configure monthly/annual packages.
  - Configure current offering.
  - Configure `dialed_pro` entitlement.
  - Configure webhook to `sync-revenuecat-webhook`.
- For iOS native testing:
  - Use a development build, not Expo Go.
  - Enable HealthKit capability.
  - Validate camera/photo library/notifications/HealthKit permission copy.
  - Configure Expo push credentials before production push testing.

## Real iPhone Smoke Checklist

Run this after the Daily Proof migration is applied:

1. Install/open the iOS development build.
2. Sign up with email/password.
3. Complete onboarding and confirm the app routes to first proof.
4. Choose Quick Proof and confirm it asks for Add Photo, Add Location, Use Health Data, or Save as Manual Note.
5. Save a Manual Note and confirm Daily Proof count does not decrease.
6. Confirm the note appears on Home as context only / not ranked.
7. Start Quick Proof again and choose Add Photo, or open Capture directly.
8. Create a Photo Proof and confirm Daily Proof count decreases.
9. Open Capture with Food Proof mode, submit a meal photo, and confirm estimated macros appear or the Food Analysis card shows pending/setup clearly.
10. Open Settings > Health on a real iPhone development build and confirm Apple Health can connect/sync; on simulator/Expo Go confirm the unavailable copy is clear and HealthKit diagnostics stay readable.
11. Tap View Today and confirm the Photo/Food Proof appears on Home as verified/pending verification.
12. Pull to refresh Home and confirm entries remain.
13. Confirm photo proof uploads, or that the exact storage error appears in Settings dev diagnostics.
14. Open Settings and confirm current user id, profile id/onboarding, Proof wallet, auth/profile/entry/storage/scoring/food-analysis/HealthKit diagnostics, verification method, and trust/confidence.
15. Sign out.
16. Sign back in and confirm the session/profile/today entries restore.

`score-entry` is optional for the first beta smoke if pending-score behavior is acceptable. It is required before claiming the full "Get your Dialed Score" promise in TestFlight.

## 🔥 Highest-Priority Next Fixes

1. Apply and smoke-test Daily Proof Economy v1 migration, then confirm wallet spend/earn transactions on real entries.
2. Apply and smoke-test Food Analysis migration, then deploy/configure `analyze-food-proof` or accept Food Proof pending-only behavior for beta.
3. Retest normal public email sign-up after Supabase Auth rate limiting clears.
4. Deploy and verify `score-entry`, then confirm `entry_scores`, `daily_scores`, and `streaks` update after verified photo/health/location/hybrid proofs while Manual Notes remain excluded from ranked score.
5. Real-device smoke the first-session path: sign up, onboarding, `/first-proof`, Quick Proof, Manual Note, Photo Proof, Food Proof, reward card, Home.
6. Verify photo capture/upload and Apple Health sync through the app UI on an iOS development build.
7. Test two-user social flow: search, friend request, accept, create entries, react, leaderboard.
8. Clean stale phone/Twilio-first setup wording in README and Supabase manual docs.
9. Add generated Supabase TypeScript database types so invalid column writes are caught before runtime.
10. Decide whether the repo should stay on Expo SDK 55 or align package versions/docs with the SDK 54 instruction.
