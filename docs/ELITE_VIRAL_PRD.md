# Dialed Self Elite Viral PRD

## Executive Summary

Dialed Self is a daily status game for becoming your best self.

Users spend limited Daily Proofs to verify healthy actions, earn a Dialed Score, complete Movement/Fuel/Mind/Recovery pillars, compete with friends, and share the best proof of their day.

Dialed Self should not feel like a generic health tracker. It should feel like BeReal-style proof, Strava-style competition, WHOOP/Levels-style data polish, Snapchat/Instagram-native sharing, and a finite game economy compressed into one clear daily loop:

1. Prove your day.
2. Get your Dialed Score.
3. Beat your friends.
4. Share the proof.

Everything in the product should answer four questions:

- How Dialed am I today?
- What did I prove?
- Who am I beating?
- What can I share?

## Product North Star

North star statement:

> A daily status game for becoming your best self.

One-sentence product explanation:

> Users spend limited Daily Proofs to verify healthy actions, earn a Dialed Score, complete four pillars, compete with friends, and share the best version of their day.

Primary promise:

> Prove your day. Get your Dialed Score. Beat your friends.

Secondary share promise:

> Proof > promises.

## Target User

Primary beta users:

- Competitive, health-conscious iPhone users.
- People who already work out, track steps, care about food, sleep, focus, or recovery.
- Friend groups who want accountability without a generic tracker.
- Users who share lifestyle proof in stories and want it to look premium.
- High-agency users who like streaks, status, rankings, and tight feedback loops.

User mindset:

- "I want to know how Dialed I am today."
- "I want credit for the healthy things I actually did."
- "I want to beat my friends without turning my life into homework."
- "I want something worth sharing when I have a good day."

## Core User Questions

Every major screen should answer at least one of these:

- How Dialed am I today?
- How many Daily Proofs do I have left?
- What pillar is missing?
- What proof should I log next?
- Who is ahead of me?
- What changed after this proof?
- What can I share?

If a screen does not answer one of those questions, it should be removed, simplified, or moved to Settings/Pro/roadmap.

## Core Daily Loop

Required loop:

1. User opens app.
2. Home shows today's Dialed Score.
3. Home shows Daily Proofs remaining.
4. Home shows four-pillar progress.
5. User taps Log Proof.
6. User chooses Photo, Food, Health, Location, Hybrid, or Manual Note.
7. User submits verified proof.
8. App returns points or a pending/basic score.
9. Pillar progress updates.
10. Daily Proof count updates.
11. Leaderboard/friend context updates.
12. User sees a share card CTA.
13. Friend reacts, competes, or is invited.
14. User returns tomorrow.

First-session success:

- User understands the app in under 10 seconds.
- User completes onboarding in under 60 seconds.
- User logs first proof in under 30 seconds after onboarding.
- User sees score/reward/share moment immediately.

## Core Game System

### Daily Proofs

Daily Proofs are finite scoring attempts. They make proof feel valuable.

Daily Proofs should be visible in:

- Home header.
- Log Proof screen.
- Photo/Food Capture screen.
- Success/reward card.
- Out-of-proofs state.
- Pro paywall.

User-facing copy:

- "5 Daily Proofs left"
- "Use a Proof"
- "Save as Note"
- "Verified proofs move your score."
- "Pro unlocks more proof capacity and deeper analysis."

### Proof Types

Verified proof types:

- Photo Proof
- Food Proof
- Location Proof
- Health Proof
- Hybrid Proof

Context type:

- Manual Note

Manual Notes are not high-trust proofs. They can help timeline, recaps, and memory, but ranked score should favor verified inputs.

### Trust Ladder

Trust hierarchy:

1. Health Proof: highest trust.
2. Hybrid Proof: very high trust.
3. Photo Proof: high trust.
4. Food Proof: high trust when confidence is strong.
5. Location Proof: medium/high trust.
6. Manual Note: low trust/context only.

Trust labels:

- `verified_health`
- `hybrid`
- `photo_ai`
- `food_photo`
- `location_only`
- `manual_note`

Product rule:

> Ranked score favors verified proof.

## Dialed Score

Dialed Score is the hero metric.

Inputs:

- Verified proof count.
- Dialed Points.
- Trust level.
- Scoring confidence.
- Pillar balance.
- Streak context.
- Daily Proof usage.
- Health data.
- Friend/challenge context.

Score outputs:

- Points.
- Pillar.
- Proof type.
- Trust/confidence.
- Explanation.
- Shareable subtext.
- Pending/fallback state when server scoring is missing.

User-facing scoring language:

- Dialed Score
- Proof saved
- Verified Proof
- Verified by Health
- Food Analysis
- Fuel Quality
- Score Breakdown
- Daily Recap
- Fully Dialed Day

Avoid:

- TwainGPT
- GPT
- chatbot
- AI coach as user-facing language
- generic tracker language
- manual check-in as a primary scoring path

## Core Screens

### Home

Home is the daily status dashboard, not a feed first.

Home must show:

- Today's Dialed Score.
- Daily Proofs left.
- Four-pillar ring/progress.
- Next best proof suggestion.
- Friend/leaderboard teaser.
- Recent proofs.
- Shareable moment.

Home must answer:

- What is my score?
- What is missing?
- Who is ahead?
- What should I prove next?

Empty Home state:

- Headline: "Your score is waiting."
- CTA: "Log First Proof"
- Sub-CTAs: Photo, Food, Health, Location
- Copy: "Proof > promises. One proof lights up the day."

### Log Proof

Log Proof is the central action.

Options:

- Photo Proof
- Food Proof
- Health Proof
- Location Proof
- Manual Note

Manual Note copy:

> Manual notes help your timeline. Verified proofs move your ranked score.

### Proof Success

After proof submit, show:

- +points or pending/basic score.
- Proof type.
- Trust/confidence.
- Pillar activated.
- Daily Proof spent.
- Daily Proofs remaining.
- Share Proof CTA.
- View My Day CTA.

Pending copy:

> Proof saved. Scoring is pending.

Never show blank score values. Use "pending", "basic", or "setup required" labels.

### Leaderboard

Leaderboard should create social pressure.

Modes:

- Today
- This Week
- All Time
- Movement
- Fuel
- Mind
- Recovery
- Verified Only
- Friends
- Squads
- Challenges

Leaderboard copy:

- "One proof can move you up."
- "Ranked score favors verified proof."
- "Add friends to compete."

### Profile

Profile is identity and progress.

Show:

- Display name/username.
- Avatar.
- Total points.
- Current streak.
- Longest streak.
- Fully Dialed Days.
- Recent 7-day strip.
- Pillar balance.
- Recent proofs.
- Share/profile status moments.

## Food Proof

Food Proof should become a killer wedge.

Food Proof result should show:

- Detected foods.
- Estimated calories.
- Estimated protein/carbs/fat.
- Healthiness score.
- Fuel Quality.
- Confidence.
- Points or pending state.
- "Estimated macros, not medical advice."

Example:

- Detected: eggs, steak, avocado
- Estimated calories: 720
- Protein: 54g
- Carbs: 12g
- Fat: 48g
- Fuel Quality: Dialed
- Confidence: 74%

Food Proof should score Fuel.

Future Food Proof extensions:

- Meal history.
- Protein streak.
- Low-quality food flags.
- Grocery proof.
- Restaurant proof.
- Fuel Score.

## Health Proof

Apple Health is the first quantitative data layer.

Initial metrics:

- Steps
- Workouts
- Active energy
- Sleep
- Mindfulness

Later metrics:

- HR
- HRV
- Resting heart rate
- VO2 max
- Recovery trends

Rules:

- Do not fake wearable data.
- Show Fitbit/Oura/Garmin/WHOOP/Strava as coming soon until real.
- Raw health data stays private by default.
- Friends can see achievements, not raw metrics, unless explicitly allowed.

## Viral Sharing

Every meaningful proof should create a share moment.

Share card types:

- Entry Proof Card
- Food Macro Card
- Daily Score Card
- Fully Dialed Day Card
- Streak Card
- Leaderboard Rank Card
- Friend Comparison Card
- Weekly Recap Card
- Challenge Victory Card

Every share should include:

- Points.
- Proof type.
- Pillar.
- Username.
- Dialed branding.
- "Proof > promises"
- "Get Dialed"
- Referral/deep-link placeholder.

Share cards should feel like status symbols, not receipts.

## Social Layer

Core actions:

- Add friend.
- Accept request.
- React to proof.
- View friend day.
- Compare scores.
- Challenge friend.

Proof-native reactions:

- Dialed
- Fire
- Respect
- Hydrated
- Recovery Arc
- Slippin
- Beast

Feed rule:

> The feed shows proof events, not random posts.

Good feed items:

- "Kyle logged a Food Proof: +16"
- "Emma hit Fully Dialed Day"
- "Mason passed you on Movement"
- "Sam's Recovery streak hit 5"

## Challenges

Challenge types:

- 7-Day Fully Dialed
- Hydration Week
- Protein Streak
- 10k Steps Club
- Recovery Arc
- 5AM Movement
- Mind Monk
- No Zero Days
- Gym Crew Battle

Challenge mechanics:

- Join.
- Invite.
- Track progress.
- Proof requirements.
- Leaderboard.
- Reward badge/card.
- Share challenge result.

Private friend challenges should be Pro-gated later.

## Brand Rewards

Long-term positioning:

> Get rewarded for being Dialed.

Phase 1 rewards:

- Badges.
- Titles.
- Digital cosmetics.
- Premium templates.
- Status frames.

Phase 2 rewards:

- Partner discount codes.
- Studio/gym perks.
- Creator challenge rewards.
- Product drops.

Phase 3 rewards:

- Raffles/sweepstakes only with legal structure.

Avoid legal complexity early.

## AI And Cost Strategy

AI should feel like a judge/narrator, not a chatbot.

User-facing language:

- Proof Analysis
- Food Analysis
- Daily Recap
- Score Breakdown

AI use cases:

- Photo classification.
- Food macro estimate.
- Healthiness score.
- Proof confidence.
- Daily Recap.
- Share copy.
- Fraud/spam detection.

Cost controls:

- Edge Functions only.
- No mobile API keys.
- Cache all food/photo analyses.
- Never rescore automatically.
- Deterministic fallback scoring.
- Pro unlocks deeper analysis.
- Daily Recap can be template-based when AI is unavailable.

## Privacy And App Store Considerations

Required policies:

- Estimated macros are not medical advice.
- Dialed Score is product scoring, not medical diagnosis.
- Health data is private by default.
- Precise public location is off by default.
- Users control visibility.
- No service-role or secret keys in the client.
- Delete-account flow required before broad launch.
- Privacy policy required.
- Terms required.

## Success Metrics

Activation:

- Signup to first proof conversion.
- Time to first proof.
- Onboarding completion.

Core loop:

- Proofs per user per day.
- Daily Proof usage percentage.
- Verified proof percentage.
- Food Proof adoption.
- Health Proof adoption.
- Fully Dialed Days.
- Streak creation.

Social:

- Friends added.
- Leaderboard views.
- Reactions.
- Shares.
- Invites.
- Friend comparisons.

Revenue:

- Paywall views.
- Pro conversion.
- Proof-limit upgrade clicks.
- Premium template clicks.

Virality:

- Share cards generated.
- Share cards posted.
- Referral signups.
- Challenge invites.

## Product Rules For Future Codex Tasks

- Do not turn Dialed into a generic tracker.
- Do not make Manual Notes look equal to Verified Proofs.
- Do not call AI/model providers from the mobile client.
- Do not expose secret keys in Expo env.
- Do not loosen RLS for convenience.
- Do not add public write policies.
- Do not fake wearable support.
- Do not hide pending states behind blank values.
- Do not make Pro feel pay-to-win.
- Always protect the core promise: Prove your day. Get your Dialed Score. Beat your friends.
