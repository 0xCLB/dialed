# Dialed Self Build Plan

## Build Order

The project build order is:

1. Product docs.
2. Backend files.
3. SQL review.
4. Supabase setup.
5. Native app foundation.
6. Product features.

Do not run SQL against Supabase until the generated SQL has been reviewed.

## Repo Structure

Target structure:

```text
app/
  (auth)/
  (tabs)/
  challenges/
  entry/
  friends/
  notifications/
  settings/
  timeline/
components/
  ui/
features/
  auth/
  digest/
  entries/
  health/
  leaderboard/
  monetization/
  notifications/
  scoring/
  sharing/
  social/
lib/
supabase/
  schema.sql
  policies.sql
  storage-policies.sql
  storage-notes.md
  seed.sql
  edge-functions/
types/
docs/
```

## Sprint Order

### Sprint 1: Product And Backend Planning

- Create PRD and build plan.
- Create Supabase schema, policy, storage, seed, and edge-function stub files.
- Review SQL before touching Supabase.

### Sprint 2: Supabase Project Setup

- Create Supabase project.
- Run approved schema SQL.
- Create storage buckets.
- Run approved RLS and storage policies.
- Enable Email Auth for development/staging.
- Add Apple Sign-In and Phone Auth later for production.
- Add Twilio later for production SMS.
- Configure environment variables.

### Sprint 3: Native Foundation

- Expo Router app shell.
- Auth route group and protected app route group.
- Design system primitives.
- Supabase client.
- Environment validation.
- Navigation and loading states.

### Sprint 4: Development Auth

- Email/password sign-up.
- Email/password sign-in.
- Session persistence.
- Logout and expired-session handling.
- Auth error and rate-limit states.
- Phone OTP and Apple Sign-In placeholder stubs.

### Sprint 5: Onboarding And Profile

- Profile creation.
- Avatar upload.
- Goals and privacy defaults.
- Username/display name validation.
- Onboarding completion gate.

### Sprint 6: Entry Engine

- Native camera capture.
- Manual check-in quick-picks.
- Searchable check-in library.
- Entry creation.
- Photo upload.
- Timeline and My Day views.
- Entry privacy controls.

### Sprint 7: AI Scoring

- `score-entry` edge function.
- Client score request flow.
- AI points, confidence, tags, rationale, and witty subtext.
- Retry and failure states.
- Guardrails that prevent direct client writes to official score fields.

### Sprint 8: Progress Systems

- Daily points.
- Wellness ring.
- Pillar completion.
- Streak calculation.
- Profile stats.
- Historical timeline.

### Sprint 9: Social

- Friend search and requests.
- Friend profile views.
- Feed visibility.
- Reactions and comments.
- Privacy enforcement.
- Blocks and basic safety controls.

### Sprint 10: Leaderboards And Challenges

- Daily leaderboard.
- Weekly leaderboard.
- Friend leaderboard.
- Challenge creation and membership.
- Challenge rankings.
- Rank-change notifications.

### Sprint 11: Sharing And Reels

- Share card generation.
- My Day reel generation.
- Supabase Storage upload for share assets.
- Native share sheet.
- Branded visual templates.

### Sprint 12: Digest And Notifications

- TwainGPT daily digest.
- Smart social notification triggers.
- Push token registration.
- Notification preferences.
- Quiet hours and anti-spam rules.

### Sprint 13: RevenueCat

- Paywall.
- Entitlement checks.
- Pro gating.
- RevenueCat webhook sync.
- Subscription state recovery.

### Sprint 14: Apple Health

- HealthKit permissions.
- Workout, steps, sleep, mindfulness, and recovery imports.
- Health-derived entry creation.
- Disconnect and privacy controls.

### Sprint 15: Launch Hardening

- Error handling.
- Analytics.
- Performance pass.
- Security review.
- TestFlight readiness.
- App Store metadata.

## Supabase Setup Sequence

1. Create a new Supabase project.
2. Open SQL Editor.
3. Review `supabase/schema.sql`.
4. Run `supabase/schema.sql`.
5. Verify required tables exist.
6. Create storage buckets:
   - `entry-photos`
   - `share-assets`
   - `avatars`
7. Review `supabase/policies.sql`.
8. Run `supabase/policies.sql`.
9. Review `supabase/storage-policies.sql`.
10. Run `supabase/storage-policies.sql`.
11. Review and optionally run `supabase/seed.sql`.
12. Enable Email Auth.
13. For local development only, email confirmation may be disabled to unblock immediate sign-up/onboarding tests.
14. Later enable Apple Sign-In and Phone Auth for production.
15. Later configure Twilio for production SMS delivery.
16. Configure Edge Function secrets.
17. Deploy edge functions after local and SQL review.

## Auth Flow

Auth strategy for development/staging is email/password. Production may add Apple Sign-In and phone OTP later.

1. User signs up or signs in with email/password.
2. Client calls Supabase password auth through the Expo-native Supabase client.
3. App restores the persisted Supabase session on reload.
4. App loads or creates the profile row using the authenticated user id.
5. If onboarding is incomplete, user is routed to onboarding.
6. If onboarding is complete, user enters the main app.
7. Protected screens require an active Supabase session.
8. Logout clears local session state and returns to auth screens.
9. Phone OTP remains disabled in dev until Twilio is ready.

## Database Flow

### Entry Creation

1. Client creates an entry draft with user-owned fields.
2. Client uploads media to a user-scoped storage path when proof exists.
3. Client links media path to the entry.
4. Client requests AI scoring through an edge function.
5. Edge function validates ownership and context.
6. Edge function writes official score fields.
7. Client refreshes entry, daily points, streak, and timeline data.

### Social Activity

1. User creates or accepts a friendship.
2. User creates entries with visibility rules.
3. Friends can view only entries allowed by privacy and relationship state.
4. Friends can react or comment where policies permit.
5. Leaderboards aggregate eligible score data.

### Share Assets

1. User requests share card or reel generation.
2. Edge function validates ownership of source entries.
3. Function creates or coordinates generated asset output.
4. Asset is stored in `share-assets`.
5. Client receives a signed URL or storage path for native sharing.

### Subscription Sync

1. Client reads RevenueCat entitlement state.
2. RevenueCat webhook posts subscription updates.
3. Edge function validates webhook auth.
4. Supabase subscription tables are updated.
5. App gates Pro features from current entitlement state.

## App Screen List

- Login
- Sign-up
- Phone OTP placeholder
- Onboarding
- Home / My Day
- Capture
- Manual check-in
- Entry detail
- Daily timeline
- Profile
- Friend profile
- Friends list
- Leaderboard
- Challenges
- Notifications
- Settings
- Paywall
- Share preview
- Digest detail
- Privacy controls
- Apple Health connection

## Testing Checklist

- TypeScript typecheck passes.
- Expo config resolves.
- Environment validation fails clearly when required values are missing.
- Email/password sign-up works.
- Email/password sign-in works.
- Persisted session survives app reloads.
- Phone OTP route clearly explains that Twilio is deferred.
- Onboarding creates exactly one profile per user.
- Private entries are hidden from feeds and friend views.
- Friends-only entries are visible only to accepted friends.
- Public entries are readable under intended policies.
- Users cannot write another user's profile, entries, comments, reactions, health data, subscriptions, or assets.
- Clients cannot write official AI scoring fields directly.
- Entry photo upload uses the correct bucket and user path.
- Avatar upload uses the correct bucket and user path.
- Share asset upload and reads follow policy rules.
- AI scoring failure leaves recoverable entry state.
- Daily points and streaks handle time zones correctly.
- Leaderboards exclude private or ineligible entries.
- Comments and reactions respect blocks and privacy.
- Notification preferences are honored.
- RevenueCat entitlement state gates Pro features correctly.
- App handles offline and flaky network states.
- HealthKit permission denial is graceful.
- Native share output renders correctly on device.

## Launch Checklist

- SQL reviewed and applied in the correct order.
- Supabase tables, indexes, constraints, and RLS policies verified.
- Storage buckets and policies verified.
- Email Auth enabled for development/staging.
- Apple Sign-In enabled before App Store launch.
- Phone Auth and Twilio configured before production SMS launch.
- Edge Function secrets configured.
- Edge Functions deployed and smoke-tested.
- App environment variables configured for development and production.
- TestFlight build created from a development branch.
- Camera, photo library, location, notifications, and HealthKit permission copy reviewed.
- RevenueCat products, offerings, and entitlements configured.
- Privacy policy and terms prepared.
- App Store screenshots and metadata prepared.
- Analytics events verified.
- Crash/error reporting configured.
- Security review completed for privacy, RLS, storage, and webhook handling.
- Beta users onboarded through TestFlight.
- Launch rollback plan documented.
