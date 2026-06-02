# Dialed Self Product Requirements Document

## Product Summary

Dialed Self is a native iOS-first React Native / Expo social health competition app. Users prove healthy daily actions through photos, location context, Apple Health data, hybrid verification, and server-side Proof Analysis. Manual self-reporting exists as timeline context, not high-trust proof. The app turns everyday wellness behavior into Dialed Points, streaks, pillar completion, leaderboards, challenges, and shareable branded story cards or reels.

Dialed Self is built around four wellness pillars:

- Movement
- Fuel
- Mind
- Recovery

The product should feel fast, native, competitive, and socially sticky. It should reward small daily proof over vague intent, make progress visually satisfying, and create lightweight reasons for friends to react, compete, and return. Core rule: Proof > promises.

## Target Users

- Health-conscious iPhone users who already track workouts, meals, sleep, mindfulness, or recovery.
- Competitive friend groups who want a social proof layer for wellness, not another generic tracker.
- Users who like streaks, points, leaderboards, challenges, and visual progress systems.
- Creators, founders, athletes, and high-agency professionals who want wellness accountability without long-form journaling.
- Users who share lifestyle proof through stories and want branded, polished outputs.

## Core User Journeys

### First Run And Profile Creation

1. User opens the app and signs in with email/password for development and staging. Phone OTP stays deferred until Twilio is ready.
2. User completes onboarding with display name, avatar, goals, privacy defaults, and wellness focus.
3. User lands on the daily home view with their wellness ring, points, streak, and suggested proofs.

### Daily Proof Check-In

1. User taps Photo Proof, Quick Proof, Location Proof, or Health sync.
2. User captures a native camera photo, verifies a relevant place, imports Apple Health context, or combines signals into a hybrid proof.
3. User can add optional Manual Note context, privacy level, rough location name, or pillar selection.
4. App uploads proof media to Supabase Storage when media is present.
5. Proof Analysis returns points, trust level, confidence, category, and witty contextual subtext.
6. Verified entries appear in My Day, profile timeline, friends feed if visible, ranked leaderboards, and daily point totals.
7. Manual Notes appear in the timeline/digest context layer but are excluded from ranked score by default.

### Social Competition

1. User adds friends or accepts friend requests.
2. User views friend timelines, reacts, comments, and compares daily or weekly points.
3. User joins friend challenges and sees leaderboard movement.
4. Smart notifications nudge users when a friend passes them, reacts to them, or when a streak is at risk.

### Share And Viral Loop

1. User opens My Day or an entry summary.
2. App generates a branded story card or reel from the day.
3. User shares to social platforms with visual proof, score, pillar progress, and Dialed branding.
4. Viewers are prompted to join, challenge the user, or follow progress.

### Subscription Upgrade

1. User hits a premium limit or sees a Pro insight.
2. RevenueCat paywall explains premium value.
3. User subscribes to unlock advanced scoring, deeper recaps, richer share assets, extended history, private challenges, or premium Proof Analysis features.

## Core Features

### Authentication

- Phone OTP auth through Supabase.
- Session persistence on device.
- Authenticated route protection.
- Graceful handling of expired sessions, resend OTP, and invalid verification codes.

### Onboarding And Profile

- Display name, username, avatar, goals, and privacy preferences.
- Default visibility controls for entries and profile data.
- Profile page with points, streaks, pillars, badges, friends, and timeline.

### Native Camera Photo Check-Ins

- iOS-native camera proof capture.
- Photo upload to Supabase Storage.
- Entry creation linked to uploaded media.
- Camera permission and fallback states.

### Quick Proof And Manual Notes

- Smart quick-picks for common healthy actions.
- Quick picks become proof starters, not silent scored entries.
- User chooses how to verify: Add Photo, Add Location, Use Health Data, or Save as Manual Note.
- Pillar mapping for Movement, Fuel, Mind, and Recovery.
- Manual Notes are useful for timeline and Daily Recap context but have low trust and do not meaningfully affect ranked leaderboards.

### Verification And Trust

- Photo Proof uses server-side image classification and starts at photo classification trust.
- Location Proof uses privacy-safe rough place verification and starts at `location_only` trust.
- Health Proof uses Apple Health/wearable metrics and starts at `verified_health` trust.
- Hybrid Proof combines signals and starts at high confidence, such as `photo_location`.
- Manual Notes use `manual_note` trust and should be excluded from ranked score by default.
- Trust weights:
  - verified health: 1.00
  - photo + location: 0.95
  - photo classification: 0.85
  - location only: 0.65
  - manual note: 0.15
- Future Fuel scoring can enrich Photo Proof with macro/meal classification without making medical or diet claims.

### Server Proof Analysis

- Server scoring evaluates proof signal, context, pillar, trust level, and metadata.
- Output includes Dialed Points, confidence, scoring rationale, tags, and witty contextual subtext.
- Client should not be allowed to directly write official scoring fields.
- Failed scoring should leave an entry recoverable and retryable.

### Storage

- Supabase Storage buckets for:
  - `entry-photos`
  - `share-assets`
  - `avatars`
- Signed URL or policy-controlled access for private media.
- User-scoped paths for predictable storage policies.

### Daily Progress

- Daily points total.
- My Day timeline.
- Wellness ring with pillar completion.
- Streaks and milestone states.
- Profile and historical timeline.

### Social Graph

- Friends, requests, blocks, reactions, comments, and privacy controls.
- Feed surfaces for friend activity and challenge updates.
- User controls for public, friends-only, private, and challenge-scoped entries.

### Leaderboards And Challenges

- Daily, weekly, and friend leaderboards.
- Challenge membership, scoring windows, and rank changes.
- Tie handling and transparent score logic.
- Ranked score should favor verified photo, location, health, and hybrid proofs.
- Manual Notes are excluded or low-weighted and should not make free competition feel fake.

### Reels From My Day

- Generator that turns daily entries into shareable visual cards or reels.
- Branded layouts, pillar summaries, points, and selected proofs.
- Export through native share sheet.

### Daily Recap

- Daily Recap that summarizes wins, missed opportunities, streak risk, friend activity, and next best action.
- Tone should be witty, contextual, concise, and motivating.

### Smart Social Notifications

- Streak reminders.
- Friend reactions and comments.
- Leaderboard movement.
- Challenge updates.
- Daily Recap availability.
- Subscription and premium feature prompts where appropriate.

### Apple Health Integration

- Later-phase HealthKit integration for workouts, steps, sleep, mindfulness, and recovery signals.
- Health-derived entries should be clearly labeled and permission-controlled.
- Users must be able to opt out and disconnect health access.

### RevenueCat Subscriptions

- RevenueCat paywall and entitlement checks.
- Webhook sync to Supabase.
- Pro feature gating and subscription state recovery.

## Social And Viral Loops

- Friend leaderboards create daily return pressure.
- Reactions and comments reward visible proof.
- Challenges create shared short-term goals.
- Share cards and reels turn progress into branded social proof.
- Daily Recap copy gives users a reason to screenshot and share.
- Smart notifications create timely re-entry without generic spam.
- Streak saves and close leaderboard races create urgency.

## Monetization

Primary monetization is RevenueCat-powered subscriptions.

Potential Pro features:

- Advanced Proof Analysis and deeper score explanations.
- Unlimited or premium share cards and reels.
- Extended history and analytics.
- Private or custom challenges.
- Enhanced Daily Recap insights.
- Premium notification intelligence.
- Early access to Apple Health insights and recovery analytics.

The free tier should remain useful enough to grow the network: limited Daily Proofs, basic verified scoring, Manual Notes for context, limited social features, and core leaderboards.

## Privacy And Safety

- Users control visibility per entry and at profile defaults.
- Private entries must not leak through feeds, leaderboards, storage URLs, comments, reactions, digests, or notifications.
- RLS must protect profiles, entries, friendships, comments, reactions, health data, subscriptions, and generated assets.
- Storage policies must be user-path scoped and visibility-aware.
- Location data should be optional, coarse by default, and removable.
- Apple Health data should be permission-scoped, transparent, and never shared without explicit user action.
- Users need block/report controls before broad social launch.
- Proof Analysis should avoid medical claims and should be framed as motivational product scoring, not health diagnosis.

## Technical Stack

- Native iOS-first React Native app with Expo and Expo Router.
- TypeScript for app and edge-function code.
- Supabase Auth for email/password in development and staging. Phone OTP is deferred until Twilio is ready.
- Supabase Postgres for app data.
- Supabase Row Level Security for data protection.
- Supabase Storage for proof photos, avatars, and share assets.
- Supabase Edge Functions for server scoring, recaps, share generation, smart notifications, and RevenueCat webhook sync.
- RevenueCat for subscriptions and entitlements.
- Apple HealthKit integration in a later phase.
- Expo Notifications for push notification workflows.
- Native camera, image picker, sharing, file system, and view-shot modules for proof and share experiences.

## Success Metrics

- Activation rate: percent of signed-in users who complete onboarding and first verified proof.
- Proof creation rate: average daily verified proofs per active user.
- Retention: D1, D7, D30 retention.
- Streak health: percent of users maintaining 3-day, 7-day, and 30-day streaks.
- Social density: average friends per active user.
- Social engagement: reactions, comments, and challenge joins per active user.
- Competition engagement: leaderboard views and rank-change notification opens.
- Share rate: share cards or reels exported per active user.
- Viral coefficient: invites or new users from shared assets.
- Monetization: free-to-paid conversion, trial starts, subscription retention, and RevenueCat entitlement sync accuracy.
- Trust and safety: privacy incidents, blocked users, reports, and support tickets.
