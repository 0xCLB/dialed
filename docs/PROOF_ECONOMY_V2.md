# Dialed Self Proof Economy V2

## Purpose

Daily Proofs are the core game currency. They make proof finite, strategic, and valuable.

A Daily Proof is a scoring attempt for a meaningful verified action. It should not feel like unlimited logging.

Core rule:

> Proof > promises.

## Proof Types

### Photo Proof

User captures/uploads a photo. Server classification can identify gym, walk, hydration, reading, sauna, stretching, outdoor activity, or other wellness signals.

Trust:

- High trust when classification confidence is strong.

Consumes Daily Proof:

- Yes.

Ranked:

- Yes, if confidence and policy allow.

### Food Proof

Food-focused photo proof. Server can estimate macros, healthiness, Fuel Quality, and suggested points.

Trust:

- High trust when confidence is strong.

Consumes Daily Proof:

- Yes.

Ranked:

- Yes, if confidence and policy allow.

Important copy:

> Estimated macros, not medical advice.

### Location Proof

User verifies presence at a relevant place, such as gym, trail, park, studio, grocery, sauna, or recovery spot.

Trust:

- Medium/high trust.

Consumes Daily Proof:

- Yes.

Ranked:

- Yes, with lower confidence than Health/Hybrid.

Privacy:

- Rough place/name only by default.
- No precise public location by default.

### Health Proof

Apple Health or wearable quantitative signal.

Trust:

- Highest trust.

Consumes Daily Proof:

- Configurable. Daily sync may be system-free or consume one Proof depending on product strategy.

Ranked:

- Yes.

Privacy:

- Raw health metrics private by default.

### Hybrid Proof

Combines signals:

- Photo + location.
- Photo + Health.
- Location + Health.

Trust:

- Very high trust.

Consumes Daily Proof:

- Yes.

Ranked:

- Yes.

### Manual Note

User text/caption without verification.

Trust:

- Low trust/context only.

Consumes Daily Proof:

- No by default.

Ranked:

- No by default.

Policy:

- Manual Notes help timeline and Daily Recap.
- Manual Notes do not meaningfully affect ranked score.
- If scored for personal context later, cap at 0-3 points and keep not ranked.

## Trust Ladder

Suggested trust values:

- Health Proof: `verified_health`, 1.00
- Hybrid Proof: `hybrid`, 0.95
- Photo Proof: `photo_ai`, 0.85
- Food Proof: `food_photo`, 0.85 when confidence is high
- Location Proof: `location_only`, 0.65
- Manual Note: `manual_note`, 0.15

Leaderboard scoring should favor trust.

## Free Tier

Free users get:

- 5 Daily Proofs/day.
- Basic photo proof.
- Basic food proof.
- Health proof preview/sync.
- Basic share cards.
- Basic friend leaderboard.
- Manual Notes.

Free limits:

- Max 3 earned bonus Proofs/day.
- Basic Food Analysis can be pending/fallback.
- Premium templates locked.
- Advanced leaderboard filters locked.

Free should still be fun and competitive.

## Pro Tier

Pro users get:

- 20 Daily Proofs/day.
- More photo/food proof capacity.
- Auto Health scoring.
- Advanced Food Analysis.
- Premium share templates.
- Reels export.
- Weekly recaps.
- Advanced leaderboard filters.
- Private challenges.
- Friend comparisons.
- Streak freeze later.

Pro positioning:

> Unlock more ways to prove the day.

Pro should expand capacity, depth, and artifacts. It should not simply buy leaderboard dominance.

## Earned Bonus Proofs

Earned Proof sources:

- +1 for sharing a score card, max once/day.
- +1 for completing all four pillars yesterday.
- +1 for 3-day streak.
- +1 for invited friend signup.
- +1 for joining a challenge.

Caps:

- Free: max 3 bonus Proofs/day.
- Pro: max 5 bonus Proofs/day unless later tuning says otherwise.

Anti-spam rule:

- Bonus Proofs should reward behavior, not create unlimited logging.

## Ranked Fairness

Problem:

- Pro has more Proofs, but free users still need fair competition.

Recommended policy:

- Personal progress can count all proofs.
- Ranked daily score counts top N ranked proofs.
- Free ranked cap: top 5 ranked proofs/day.
- Pro ranked cap: top 10 ranked proofs/day.
- Manual Notes excluded by default.
- Trust weighting applied before ranked aggregation.

This lets Pro users get more capacity, artifacts, and insights without making free leaderboards pointless.

## Proof Spend Rules

Spend a Daily Proof:

- Photo Proof.
- Food Proof.
- Location Proof.
- Hybrid Proof.
- Health Proof if configured as a scoring attempt.

Do not spend a Daily Proof:

- Manual Note by default.
- System-free Health sync if product chooses that policy.
- Failed entry creation.
- Failed media upload.

Spend timing:

1. Validate user/session.
2. Validate Proof wallet.
3. Create entry/media successfully.
4. Spend Proof.
5. Request scoring.
6. If scoring fails, Proof remains spent unless entry is deleted/refunded.

## Scoring Fallback

Scoring must work without AI.

Fallback rules:

- Movement: gym/workout/photo/location, 20-30 points.
- Walk/run/steps: rule based.
- Fuel: water, 5-8 points.
- Protein/solid meal, 10-18 points.
- Mind: reading/meditation, 8-18 points.
- Recovery: sauna/stretch/sleep, 8-25 points.
- Manual Note: 0-3 personal context points max, not ranked.

Official scores:

- Server-owned in `entry_scores`.
- Client can display fallback/basic scores.
- Client should not write official score rows.

## Food Analysis Policy

Food Proof uses:

- Cached `food_analyses` by `entry_id`.
- Cached `food_analyses` by `storage_path`.
- `analyze-food-proof` Edge Function when deployed.
- Pending/basic fallback if unavailable.

Never:

- Call model providers from mobile.
- Expose API keys.
- Block proof creation because analysis is missing.
- Make medical claims.

## Health Proof Policy

Apple Health is the first quantitative proof layer.

Metrics:

- Steps.
- Workouts.
- Active energy.
- Sleep.
- Mindfulness.

Rules:

- Raw health metrics private by default.
- Health achievements can be social, raw data should not be public.
- Simulator/Expo Go should show elegant unavailable state.
- Do not fake Fitbit/Oura/Garmin/WHOOP/Strava.

## Out-Of-Proofs UX

Copy:

- "You're out of Proofs."
- "Earn more tomorrow."
- "Earn +1 by sharing today."
- "Invite a friend for +1."
- "Pro unlocks more proof capacity and deeper analysis."

Actions:

- Share today's score.
- Invite a friend.
- Come back tomorrow.
- Go Pro.

Avoid:

- Blocking Manual Notes.
- Aggressive paywall-only dead ends.

## Required Instrumentation

Track:

- Proof wallet initialized.
- Proof spend attempted.
- Proof spend succeeded.
- Proof spend failed.
- Bonus Proof earned.
- Out-of-Proofs shown.
- Paywall opened from Proof limit.
- Manual Note saved.
- Verified Proof submitted.
- Ranked score calculated.

## Codex Rules For V2 Implementation

- Do not loosen RLS.
- Do not add public write hacks.
- Do not use fake UUIDs.
- Do not spend Proof before entry creation succeeds.
- Do not spend Proof for Manual Note by default.
- Do not call AI from mobile.
- Do not fake wearable connectors.
- Do not make Pro pay-to-win.
