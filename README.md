# Dialed Self

Dialed Self is an iOS-first Expo Router app for AI-scored wellness proofs, Apple HealthKit sync,
social competition, leaderboards, share exports, and RevenueCat Pro subscriptions.

## Stack

- Expo SDK 55, React Native, TypeScript strict mode, Expo Router
- Supabase Auth phone OTP, Postgres, Storage, RLS, Edge Functions
- RevenueCat subscriptions and Pro entitlement sync
- Apple HealthKit via `@kingstinct/react-native-healthkit`
- Expo Notifications, camera/photo proof capture, native share exports

## Local Setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env` and fill the public Expo values.

3. Apply Supabase SQL in this order:

   ```sh
   supabase db push
   # or paste supabase/schema.sql, then supabase/policies.sql in SQL editor
   ```

4. Deploy Edge Functions and set server-only secrets:

   ```sh
   supabase secrets set OPENAI_API_KEY=... OPENAI_SCORING_MODEL=...
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
   supabase secrets set REVENUECAT_WEBHOOK_AUTH=...
   supabase functions deploy score-entry
   supabase functions deploy revenuecat-webhook
   supabase functions deploy daily-digest
   ```

5. Run the app in a development build. HealthKit and RevenueCat native modules do not run in Expo
   Go.

   ```sh
   npm run ios
   ```

## Verification

```sh
npm run typecheck
npx tsc --noEmit --noUnusedLocals --noUnusedParameters
npx expo install --check
npx expo config --type public
```

## Security Notes

- AI provider keys and Supabase service role keys are only used in Edge Functions.
- Client-created entries are scored by `score-entry`; RLS prevents clients from writing official AI
  score fields directly.
- Every app-owned table has RLS enabled in `supabase/policies.sql`.
- Private storage buckets use user-path policies and signed URLs for rendering proof media.
