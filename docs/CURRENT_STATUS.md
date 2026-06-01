# Current Status

## What Exists

- Dialed Self is already an Expo Router / React Native app, not only backend docs.
- Product planning docs exist:
  - `docs/PRD.md`
  - `docs/BUILD_PLAN.md`
- Supabase backend blueprint files exist:
  - `supabase/schema.sql`
  - `supabase/policies.sql`
  - `supabase/storage-policies.sql`
  - `supabase/storage-notes.md`
  - `supabase/seed.sql`
  - Edge Function stubs for scoring, digest, share card, smart notification, and RevenueCat sync.
- App foundation exists:
  - Root Expo Router layout.
  - Auth route group.
  - Protected tab route group.
  - UI primitives.
  - Supabase client setup.
  - Email/password dev auth screens.
  - Phone OTP and Apple Sign-In future stubs.
  - Onboarding screen.
  - Basic protected tabs for home, capture, check-in, leaderboard, and profile.
- Entry Engine v1 exists:
  - `features/entries/types.ts` defines the app-side entry, media, score, daily score, and create-input models.
  - `features/entries/entryService.ts` creates manual/photo entries, uploads proof media, requests scoring, loads today's entries, loads daily scores, and hydrates signed photo URLs.
  - `features/scoring/scoringService.ts` calls the `score-entry` Edge Function and returns safe pending-state errors for missing functions, network errors, and auth failures.
  - Manual Check-In creates `entries` rows with `status = 'pending_score'`, then requests scoring.
  - Capture uses the native image picker camera/library flow, creates the photo entry, creates an `entry_media` row, uploads to the `entry-photos` bucket, then requests scoring.
  - Home/My Day fetches today's entries and `daily_scores`, derives totals from `entry_scores` when a daily row is absent, and shows pending/scored entry cards.
  - Profile now includes a recent-entry timeline.
- Progress Systems v1 exists:
  - `features/progress/types.ts` defines progress models for daily scores, streaks, pillar progress, day summaries, and profile stats.
  - `features/progress/progressService.ts` reads `daily_scores` and `streaks`, derives local daily totals from hydrated `entry_scores`, and derives a simple streak from recent daily scores when the server streak row is missing.
  - `components/progress/` contains Wellness Ring, pillar cards, streak card, day summary card, mini calendar strip, and Fully Dialed banner.
  - Home shows today's total points, a 4-pillar ring, missing pillar suggestions, current streak, Fully Dialed state, and today's entries.
  - Profile shows avatar/name, current and longest streaks, total points from fetched daily scores, Fully Dialed day count, 7-day strip, pillar balance, and recent entries.
  - Timeline day screens show date totals, ring, pending/scored entries, Fully Dialed banner, and a placeholder share-card CTA.
- Social + Leaderboard v1 exists:
  - `features/social/types.ts` defines profile summaries, friendships, friend requests, reactions, and friend feed items.
  - `features/social/socialService.ts` searches profiles, reads friendships, sends/accepts/declines/removes friend requests, reads visible friend profiles/feed items, and writes/deletes reactions through the `reactions` table.
  - `features/leaderboard/types.ts` and `features/leaderboard/leaderboardService.ts` derive daily, weekly, and recent all-time friends leaderboards from `daily_scores` plus profile summaries.
  - `components/social/` contains search results, request cards, friend list rows, reaction bar, and friend feed cards.
  - `components/leaderboard/` contains leaderboard tabs, rows, rank badges, and mini pillar bars.
  - Friends screen supports search, add friend, incoming requests, outgoing requests, accepted friends, and navigation to friend profiles.
  - Friend profile screen shows privacy-safe visible profile summary, today progress, streak, pillar snapshot, visible entries, reactions, and remove-friend action.
  - Leaderboard tab supports Daily, Weekly, and All-Time tabs with friends-first rows and current-user highlighting.
  - Home includes a small "Friends Getting Dialed" feed module plus CTAs to Friends and Leaderboard.
- Share Cards + Viral Loop v1 exists:
  - `features/sharing/types.ts` defines share card types, templates, share data, and export result models.
  - `features/sharing/shareDataService.ts` builds share data for entry, daily score, Fully Dialed Day, streak, leaderboard rank, friend comparison, and AI digest quote placeholder cards.
  - `features/sharing/shareExportService.ts` captures story cards with `react-native-view-shot`, saves a local copy, opens the native share sheet through Expo Sharing, creates `share_assets` rows, and uploads PNGs to Supabase Storage.
  - `components/sharing/` contains the 9:16 card frame, entry/daily/fully-dialed/streak/leaderboard/friend-compare/digest cards, template picker, share preview modal, and share CTA button.
  - Entry success, entry detail, Home daily summary, Home digest quote, Profile streak, Timeline day, Leaderboard rank, and Friend comparison screens can open share previews.
  - Shared cards include Dialed Self branding, `@username`, Get Dialed CTA, invite-code placeholder, and deep-link placeholder metadata.
- Reels From My Day v1 exists:
  - `features/reels/types.ts` defines daily/weekly reel data, slide types, templates, and export status/result models.
  - `features/reels/reelDataService.ts` builds daily reel data from profiles, entries, entry scores, daily scores, streaks, daily digests when present, and friends leaderboard rows when visible.
  - `features/reels/reelExportService.ts` captures the visible 9:16 reel slide with `react-native-view-shot`, saves a local PNG, opens the native share sheet through Expo Sharing, creates a `share_assets` row with `asset_type = 'reel'`, and uploads the cover PNG to Supabase Storage.
  - `components/reels/` contains the preview modal, 9:16 frame, intro/entry/pillar/leaderboard/outro slides, progress dots, template picker, and export button.
  - Timeline day screens can generate a daily reel preview from that date.
  - Profile shows recent proof days with Reel CTAs and a weekly reel placeholder CTA.
- TwainGPT Digest v1 exists:
  - `features/digest/types.ts` defines digest tone, digest records, insight rows, input summaries, recommendations, and share data.
  - `features/digest/digestService.ts` reads existing `daily_digests`, builds digest input from entries, entry scores, daily scores, streaks, profile data, and friends leaderboard context, calls the `generate-digest` Edge Function when available, and falls back to local action-based TwainGPT templates when the function is missing or fails.
  - `components/digest/` contains the digest card, pillar summary, insight rows, quote card, recommendation card, loading state, and empty state.
  - `app/digest/[date].tsx` shows the full daily digest, can generate/regenerate, and can open a digest quote share card.
  - Home shows a TwainGPT Digest preview after today has entries.
  - Timeline day screens link to the digest screen.
  - Reels can include a digest slide when a saved digest exists.
- Smart Notifications v1 exists:
  - `features/notifications/types.ts` defines preferences, devices, notification records, deep links, and smart notification candidates.
  - `features/notifications/notificationCopy.ts` contains witty, action-based copy templates and interest scoring rules for friend activity, leaderboard movement, streak risk, digest drops, reactions, and requests.
  - `features/notifications/notificationService.ts` reads/writes preferences and device rows, reads in-app notifications, marks notifications read, calls the `send-smart-notification` Edge Function, and falls back to local dev notifications when server persistence is unavailable.
  - `lib/notifications.ts` configures Expo notification handlers, requests push permission, stores Expo push tokens in `notification_devices`, schedules local dev reminders, and routes notification taps through Expo Router.
  - `app/notifications/index.tsx` shows an inbox with read/unread states and deep-link navigation.
  - `app/settings/notifications.tsx` manages smart alert preferences, quiet-hour placeholders, device registration, and a dev-only test notification.
  - Home/Profile expose notification entry points, and onboarding can register the device after opt-in.
- Apple Health + Wearables v1 exists:
  - `features/health/types.ts` defines health providers, metric types, samples, sync status, provider connections, local health scoring, privacy settings, and today's health summary.
  - `features/health/appleHealthService.ts` guards HealthKit behind iOS runtime checks, requests read permissions, and reads aggregate steps, active energy, workout minutes, sleep minutes, and mindfulness minutes.
  - `features/health/providerAdapter.ts` provides the live Apple Health adapter plus coming-soon Fitbit, Oura, Garmin, Strava, and WHOOP adapters.
  - `features/health/healthScoringService.ts` derives conservative, non-medical local preview points for Movement, Mind, and Recovery health signals.
  - `features/health/healthService.ts` saves private rows to `health_samples`, creates private `health` entries with `status = 'pending_score'`, requests server scoring when available, derives today's health summary, and stores local privacy settings.
  - `app/settings/health.tsx` lets users connect/sync Apple Health, view today's private health contribution, inspect wearable placeholders, and manage health privacy toggles.
  - Home and Profile show health contribution cards when synced samples exist.
- RevenueCat Pro v1 exists:
  - `features/monetization/types.ts` defines the `dialed_pro` entitlement, subscription statuses, paywall placements, Pro features, and app subscription state.
  - `lib/revenuecat.ts` lazy-loads `react-native-purchases`, configures RevenueCat with `EXPO_PUBLIC_REVENUECAT_API_KEY`, identifies/logs out users, reads CustomerInfo/offerings, purchases packages, restores purchases, and tracks purchase/restore/entitlement analytics.
  - `features/monetization/proService.ts` reads the RLS-protected `subscriptions` table, derives fallback Pro state from RevenueCat CustomerInfo, and safely falls back when client subscription writes are blocked.
  - `features/monetization/usePro.ts` exposes `isPro`, loading/error state, CustomerInfo, offerings/packages, `refreshProStatus`, `requirePro`, `openPaywall`, purchase, restore, and the app's Pro feature catalog.
  - `components/monetization/` contains Pro badge, locked feature card, paywall benefit row, package card, Pro gate, and upgrade CTA components.
  - `app/paywall.tsx` is a native paywall with benefits, monthly/annual package cards when offerings exist, purchase/restore flows, Pro state, and a RevenueCat setup fallback state.
  - Profile and Settings show Pro status, manage/upgrade, and restore actions.
  - Premium share templates, reel export/templates, weekly digest placeholder, advanced scoring explanations, friend comparison insight, advanced leaderboard filters, private challenge builder placeholder, remove-watermark placeholder, and advanced health analytics placeholder are gated.

## What Is Missing

- Local `.env` is not committed and must be created manually from `.env.example`.
- Active development/staging auth is email/password through Supabase Auth.
- Supabase Email provider must be enabled. Email confirmation may be disabled for local development only to let sign-up immediately create the authenticated profile row.
- Phone OTP is deferred until Twilio is ready. Apple Sign-In remains planned before App Store launch.
- Supabase Storage buckets still need privileged confirmation or creation:
  - `entry-photos`
  - `share-assets`
  - `avatars`
- Edge Functions were not deployed in the connected project based on the last read-only function checks. Entry Engine v1 gracefully leaves saved entries in a pending state if `score-entry` is unavailable.
- Real AI scoring, server leaderboard aggregates, full challenge flows, and comments remain future build blocks.
- RevenueCat Pro v1 requires RevenueCat dashboard configuration before live purchases work: public SDK key, products, monthly/annual packages, offering, and `dialed_pro` entitlement. Without offerings, the paywall renders a setup fallback state.
- Subscription writes remain server-owned. The app can read `subscriptions`; the RevenueCat webhook should write `subscriptions`, `subscription_events`, and `profiles.is_pro`.
- Smart Notifications v1 needs the `send-smart-notification` Edge Function deployed for persistent server-created push/inbox notifications. In development, the app can fall back to a local scheduled notification when server insert is blocked by RLS.
- Apple Health sync requires an iOS development build with HealthKit capability enabled. It does not work in Expo Go or web.
- Fitbit is UI-stubbed but not currently accepted by the `health_samples.provider` SQL check constraint. Oura, Garmin, Strava, and WHOOP are provider stubs until connector auth/API work is built.
- True MP4 reel rendering is intentionally out of scope. Reels v1 exports a cover/story image while metadata includes prep TODOs for slide sequences, cloud ffmpeg rendering, audio templates, and weekly recap video.
- TwainGPT Digest v1 is Edge-Function-first, but it is safe as fallback-only until `generate-digest` is deployed with server-side AI credentials. The mobile client does not call OpenAI directly and contains no AI API keys.
- Health samples are saved client-side under RLS, but official health-derived `entry_scores`, `daily_scores`, and streak updates still depend on deployed server scoring/aggregation. The app displays local health preview points until that server path is live.
- Generated TypeScript database types should be regenerated from Supabase after the final schema is accepted.
- Profile total points and pillar balance currently use fetched `daily_scores` rows. A future server-side profile aggregate should replace this for true all-time totals.

## Entry Engine v1 Screen Status

- Home:
  - Loads the signed-in user's current profile/session context.
  - Loads today's entries from `entries`.
  - Loads today's `daily_scores` row when present.
  - Falls back to derived totals from `entry_scores` when `daily_scores` has not been recalculated yet.
  - Shows pending entries as `Scoring...`.
- Check-In:
  - Supports quick picks, custom activity text, optional caption, pillar override, and visibility selection.
  - Creates a manual entry only when an authenticated user is present.
  - Does not write official score fields from the client.
- Capture:
  - Supports camera capture and library selection through Expo Image Picker.
  - Uploads proof media to `entry-photos/{user_id}/{entry_id}/{media_id}.jpg|png`.
  - Creates the matching `entry_media` row before scoring.
- Profile:
  - Shows the latest 10 entries for the authenticated user.

## Progress Systems v1 Screen Status

- Home:
  - Uses server `daily_scores` for today's totals when present.
  - Falls back to hydrated `entry_scores` when today's `daily_scores` row has not been generated.
  - Shows pending entries without crashing when scores are missing.
  - Shows a Fully Dialed banner when all four pillars have points.
- Profile:
  - Reads recent `daily_scores` for the calendar strip, Fully Dialed count, and pillar balance.
  - Reads `streaks` for current/longest streaks when available.
  - Derives a simple streak from recent daily scores if `streaks` is missing.
- Timeline:
  - Loads entries for the selected date and the matching `daily_scores` row.
  - Falls back to local score derivation if that daily aggregate row is missing.
  - Share-card generation is intentionally a placeholder for a later sharing block.

## Social + Leaderboard v1 Screen Status

- Friends:
  - Searches `profiles` by username/display name.
  - Sends friend requests as the authenticated user.
  - Accepts incoming requests, declines by deleting pending rows, and removes accepted friends by deleting the friendship row.
  - Uses RLS-visible profile rows only.
- Friend Profile:
  - Reads visible profile, daily score, streak, and entries.
  - Private entries/photos remain hidden by RLS and render as an empty state.
  - Reactions write to `reactions` and delete the signed-in user's matching reaction.
- Leaderboard:
  - Daily friends leaderboard reads the selected date from `daily_scores`.
  - Weekly and all-time tabs are client-side placeholders derived from recent `daily_scores`, not server aggregate tables yet.
  - Global and challenge leaderboards are not implemented in this pass.
- Home Social Module:
  - Reads recent friend entries that RLS permits.
  - Shows safe empty state if there are no friends or no visible friend entries.

## Share Cards + Viral Loop v1 Screen Status

- Working card types:
  - Individual entry proof.
  - Daily score.
  - Fully Dialed Day.
  - Streak milestone.
  - Leaderboard rank.
  - Friend comparison.
  - TwainGPT digest quote.
- Templates:
  - Free: `clean`, `pastel`, `fully_dialed`, `recovery`, `hydration`.
  - Pro placeholder/locked: `dark`, `athlete`, `leaderboard`.
- Export flow:
  - Preview renders a 9:16 card.
  - Capture uses `react-native-view-shot`.
  - Native share uses `expo-sharing`.
  - Upload uses `share-assets/{user_id}/{asset_id}.png` and creates/updates `share_assets`.
- Still placeholder:
  - Referral/invite code generation.
  - Real deep link routing.
  - Remove-watermark export polish.
  - Cloud video/reel rendering.

## TwainGPT Digest v1 Screen Status

- Data powering the digest:
  - Authenticated profile from `profiles`.
  - Day entries from `entries`.
  - Scored entry context from hydrated `entry_scores`.
  - Daily totals from `daily_scores`, with local derivation through progress services when needed.
  - Streak context from `streaks`, with existing local fallback logic.
  - Friends leaderboard context from visible `daily_scores` rows.
  - Saved/generated digest rows from `daily_digests`.
- Generation flow:
  - Calls Supabase Edge Function `generate-digest` with `{ user_id, digest_date, tone: "twain" }`.
  - If the Edge Function succeeds, the app displays the returned title/body/insights and treats the row as server-persisted.
  - If the Edge Function is missing, unauthenticated, or fails, the app uses local deterministic TwainGPT fallback copy.
  - Local fallback attempts to save to `daily_digests`, but client writes are expected to be blocked by current RLS. The UI still works with an unsaved fallback digest.
- Safety:
  - Copy is action-based, non-medical, and avoids body judgment, diagnosis, diet claims, or mental-health claims.
  - Thin data uses gentle copy: "Not enough proof to judge the empire yet. Log a few more wins."
- Screens:
  - Home shows a digest preview once today has entries and can generate/open the digest.
  - Timeline links to the digest for that date.
  - Digest detail screen shows score, pillar analysis, best/missed opportunities, friend context, recommendation, and quote sharing.
- Still placeholder:
  - Real LLM prompting/evaluation in the Edge Function.
  - Digest archives.
  - Weekly digest generation is now Pro-gated as a placeholder.
  - Recommendation completion tracking.
  - Advanced digest history/templates.

## Smart Notifications v1 Screen Status

- Inbox:
  - Reads `notifications` rows for the signed-in user.
  - Shows read/unread status, actor-safe copy, timestamps, and deep-link navigation.
  - Supports marking one notification read and marking all read.
- Settings:
  - Reads/upserts `notification_preferences`.
  - Registers the current Expo push token into `notification_devices`.
  - Supports friend activity, leaderboard movement, streak risk, digest ready, challenge updates, marketing/off, and quiet-hour placeholder fields.
  - Includes a dev-only test send path that calls `send-smart-notification` first and falls back to local notification scheduling when needed.
- Smart copy:
  - Candidate interest scoring boosts close friends, high-point entries, friend pass events, all-pillar days, and urgency.
  - Candidate interest scoring suppresses low-signal or too-many-today notifications.
  - Copy is witty and encouraging without medical claims or shame.
- Still placeholder:
  - Production push delivery depends on Expo push credentials and deployed `send-smart-notification`.
  - Server-side notification batching/quiet-hours enforcement.
  - `friend_entry` is app-side typed and mapped to `system` for the current backend check constraint until SQL is expanded.

## Apple Health + Wearables v1 Screen Status

- Apple Health:
  - Checks iOS/HealthKit availability.
  - Requests read permissions through `@kingstinct/react-native-healthkit`.
  - Reads aggregate steps, active energy, workout minutes, sleep minutes, and mindfulness minutes.
  - Saves private samples into `health_samples`.
  - Creates private pending `health` entries and requests `score-entry` when available.
- Health Settings:
  - Shows connect/sync controls, today's local preview DP, synced sample count, Movement/Mind/Recovery health contribution, recent signals, wearable stubs, privacy toggles, and Pro hooks.
  - Privacy defaults keep raw metrics private and make social health achievements opt-in.
- Home/Profile:
  - Show health contribution cards when today's samples exist.
  - Do not crash when no samples exist or HealthKit is unavailable.
- Still placeholder:
  - Official health scoring rows remain server-owned and require `score-entry`/aggregation deployment.
  - Background sync and HealthKit anchor-based incremental sync.
  - Wearable OAuth/API connectors.
  - Fitbit backend support requires a provider check-constraint migration before rows can be saved.

## Reels From My Day v1 Screen Status

- Working reel surfaces:
  - Timeline has a "Generate Reel" CTA for the selected day.
  - Profile lists recent proof days with Reel CTAs.
  - Profile includes a weekly reel placeholder CTA for the later Pro/weekly system.
- Daily reel preview:
  - Builds an intro slide with date, total points, and 4-pillar summary.
  - Builds entry slides with proof photo when available, activity copy, points or pending scoring state, pillar, timestamp, and AI subtext/caption.
  - Builds a pillar summary slide with completed/missing pillars.
  - Builds a leaderboard slide from visible daily friends leaderboard rows when available.
  - Adds a TwainGPT digest slide only when a `daily_digests` row exists.
  - Adds an outro with `@username`, Get Dialed branding, watermark, invite/deep-link placeholder metadata, and Pro hook placeholders.
- Export flow:
  - V1 captures and shares the currently visible 9:16 slide as a PNG cover image.
  - Upload uses `share-assets/{user_id}/{asset_id}.png` and creates/updates `share_assets` with `asset_type = 'reel'`.
  - Export metadata marks this as `reel_v1` and records the future true-video renderer TODO.
- Still placeholder:
  - True MP4 assembly.
  - Capturing/uploading full slide image sequences from the modal.
  - Music/audio templates.
  - Weekly reels.
  - Remove-watermark export polish.

## RevenueCat Pro v1 Screen Status

- Paywall:
  - Shows “Become dangerously consistent.” with a premium benefits list.
  - Loads RevenueCat offerings and renders package cards when monthly/annual packages are configured.
  - Starts purchase flow through `Purchases.purchasePackage`.
  - Restores purchases through `Purchases.restorePurchases`.
  - Shows current Pro state and graceful setup fallback when RevenueCat is not configured or no offering exists.
- Entitlement state:
  - Uses RevenueCat CustomerInfo first for live purchase/restore results.
  - Reads Supabase `subscriptions` when webhook/server sync has written a row.
  - Also honors `profiles.is_pro` so backend webhook updates appear in Profile/Settings.
- Gates:
  - Premium share templates open the paywall when tapped.
  - Reel export is Pro-gated while reel preview remains available.
  - Advanced AI scoring explanation, weekly digest, friend comparison insights, advanced leaderboard filters, private challenge creation, remove watermark, and advanced health analytics are gated placeholders.
  - Pro badge appears on Profile when entitlement/profile state is active.
- RevenueCat webhook:
  - Preferred function: `supabase/edge-functions/sync-revenuecat-webhook/index.ts`.
  - Expected payload shape is RevenueCat's webhook payload with `event.app_user_id` or `event.original_app_user_id`, optional `event.aliases`, optional `event.subscriber_attributes.supabase_user_id.value`, `event.entitlement_id`, `event.product_id`, `event.type`, and `event.expiration_at_ms`.
  - Required Supabase secrets: `REVENUECAT_WEBHOOK_AUTH` for bearer auth and `SUPABASE_SERVICE_ROLE_KEY` for server-owned writes.
  - The webhook maps RevenueCat events into `subscriptions`, records raw payloads in `subscription_events`, and updates `profiles.is_pro`.
- Still placeholder:
  - StoreKit sandbox/App Store Connect product setup.
  - RevenueCat dashboard products, entitlement, offering, and webhook endpoint.
  - True manage-subscription deep link UI beyond RevenueCat `managementURL` awareness.
  - Hard enforcement for every future Pro-only backend feature.

## What Is Safe To Run

- Local dependency install:
  - `npm install`
- Local verification:
  - `npm run typecheck`
  - `npx tsc --noEmit`
  - `npx expo install --check`
  - `npx expo config --type public`
- Local app start after `.env` is filled:
  - `npm run ios`

Do not run SQL blindly. The connected Supabase project already responds as if the expected public table endpoints exist, so schema changes should be reviewed before any migration is applied.

## What Needs Manual Setup

- Create `.env` locally with `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_REVENUECAT_API_KEY`, and `EXPO_PUBLIC_APP_ENV`.
- Verify Supabase project ownership/access for project ref `yifbscfdazoqqzxxzeaj`.
- Confirm RLS status with privileged Supabase MCP or SQL editor access.
- Confirm or create Storage buckets.
- Confirm `entry-photos` has the storage policies from `supabase/storage-policies.sql`.
- Deploy `score-entry` before expecting automatic points, `entry_scores`, `daily_scores`, and streak updates.
- Deploy `send-smart-notification` and configure Expo push credentials before expecting production push delivery.
- Build and run an iOS development client with HealthKit capability enabled before testing Apple Health sync.
- Configure RevenueCat dashboard: products, monthly/annual packages, current offering, `dialed_pro` entitlement, and webhook URL pointed at `sync-revenuecat-webhook`.
- Set `EXPO_PUBLIC_REVENUECAT_API_KEY` in `.env` and set `REVENUECAT_WEBHOOK_AUTH` plus `SUPABASE_SERVICE_ROLE_KEY` as Supabase Edge Function secrets.
- Deploy other Edge Functions only after SQL and environment secrets are reviewed.
- Configure server-only secrets inside Supabase, not in the app repo.

## Next Recommended Task

- Apple Health advanced analytics v1 or App Store readiness pass:
  - Apple Health advanced analytics can make Pro feel materially valuable with HRV, sleep consistency, recovery trends, and wearable comparisons.
  - App Store readiness should harden native permissions, push credentials, HealthKit review copy, RevenueCat dashboard/webhook setup, and production Edge Function deployments.
