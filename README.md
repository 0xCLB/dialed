# Dialed Self

Dialed Self is an iOS-first Expo Router app for verified wellness proofs, Proof Analysis, Apple HealthKit sync,
social competition, leaderboards, share exports, and RevenueCat Pro subscriptions.

## Stack

- Expo SDK 55, React Native, TypeScript strict mode, Expo Router
- Supabase Auth email/password for development, Postgres, Storage, RLS, Edge Functions
- RevenueCat subscriptions and Pro entitlement sync
- Apple HealthKit via `@kingstinct/react-native-healthkit`
- Expo Notifications, camera/photo proof capture, native share exports

## Local Setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env` and fill the public Expo values:

   ```sh
   cp .env.example .env
   ```

   Required local values:

   ```sh
   EXPO_PUBLIC_SUPABASE_URL=...
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
   EXPO_PUBLIC_REVENUECAT_API_KEY=...
   EXPO_PUBLIC_APP_ENV=development
   ```

3. Review Supabase status docs before running any SQL:

   - `docs/SUPABASE_AUDIT.md`
   - `docs/SUPABASE_MIGRATION_PLAN.md`
   - `docs/SUPABASE_MANUAL_STEPS.md`

   The connected project already exposes the expected Dialed table endpoints, so do not blindly
   rerun the schema. Use a privileged Supabase MCP or SQL Editor audit first.

4. Configure optional server-only Edge Function secrets in Supabase, never in the app repo. Beta can run with deterministic fallback scoring while these are absent:

   ```sh
   supabase secrets set OPENAI_API_KEY=... OPENAI_SCORING_MODEL=...
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
   supabase secrets set REVENUECAT_WEBHOOK_AUTH=...
   supabase secrets set DIALED_INTERNAL_FUNCTION_TOKEN=...
   ```

5. Deploy Edge Functions after SQL, RLS, buckets, and secrets are verified:

   ```sh
   supabase functions deploy score-entry
   supabase functions deploy generate-digest
   supabase functions deploy create-share-card
   supabase functions deploy send-smart-notification
   supabase functions deploy sync-revenuecat-webhook
   ```

6. Run the app in a development build. HealthKit and RevenueCat native modules do not run in Expo
   Go. Apple Health sync requires an iOS development client with the HealthKit capability and the
   `@kingstinct/react-native-healthkit` config plugin applied. RevenueCat purchases require a
   native development build with App Store / sandbox product configuration.

   ```sh
   npm run ios
   ```

## Verification

```sh
npm run typecheck
npx tsc --noEmit
npx expo install --check
npx expo config --type public
```

## Security Notes

- Model provider keys and Supabase service role keys are only used in Edge Functions.
- Client-created entries are scored by `score-entry`; official scoring lives in server-owned
  `entry_scores`.
- Client-synced health samples are private `health_samples` rows. The app can create private
  pending `health` entries, but official health scores still require the server scoring path.
- Every app-owned table has RLS enabled in `supabase/policies.sql`.
- Private storage buckets use user-path policies and signed URLs for rendering proof media.
- Smart notifications store Expo push tokens in `notification_devices`; production delivery requires
  Expo push credentials and the `send-smart-notification` Edge Function.
- RevenueCat uses only the public SDK key in the app. Subscription writes to `subscriptions`,
  `subscription_events`, and `profiles.is_pro` should come from `sync-revenuecat-webhook` with
  `SUPABASE_SERVICE_ROLE_KEY`.

## RevenueCat Setup

- In RevenueCat, configure products, monthly/annual packages, a current offering, and the
  `dialed_pro` entitlement.
- Set `EXPO_PUBLIC_REVENUECAT_API_KEY` locally.
- Deploy `sync-revenuecat-webhook` and set server-only secrets:

  ```sh
  supabase secrets set REVENUECAT_WEBHOOK_AUTH=...
  supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
  ```

- Configure the RevenueCat webhook URL to the deployed function and send the bearer token matching
  `REVENUECAT_WEBHOOK_AUTH`.
- The webhook expects RevenueCat's event payload with `app_user_id` / `original_app_user_id` or
  `subscriber_attributes.supabase_user_id.value`, then writes `subscriptions` and
  `subscription_events`.

## Current Limitations

- The native app now has auth/onboarding, entry engine, progress systems, social/friends,
  leaderboards, share cards, reels, Daily Recap, smart notification settings/inbox, and Apple
  Health sync surfaces.
- `score-entry`, `generate-digest`, `create-share-card`, and `send-smart-notification` must be
  deployed before server-owned scoring, saved recaps, share asset generation, and production
  pushes are fully live.
- RevenueCat purchase buttons require dashboard offerings. Without offerings, the app shows a safe
  setup fallback and restore still attempts to refresh CustomerInfo.
- Apple Health works only in an iOS development/production build, not Expo Go or web.
- Fitbit is UI-stubbed but the current `health_samples.provider` SQL check constraint does not yet
  allow `fitbit`; Oura, Garmin, Strava, and WHOOP are connector placeholders.
- Dialed Pro v1 includes paywall, restore, entitlement display, and premium gates. Advanced Pro
  features such as weekly recap generation, remove-watermark exports, private challenge builder,
  and health analytics are placeholder-gated until those feature passes are built.
- Supabase MCP is configured and authenticated locally, but this running Codex session did not expose
  callable Supabase MCP tools until a restart/new thread.
