# Dialed Self Post-Beta Roadmap

## Purpose

This roadmap organizes the next product stages after the current beta implementation queue.

The product should graduate from "working app" to "elite viral daily game" by improving clarity, social pressure, share artifacts, quantified proof, monetization, and eventually brand rewards.

## Immediate Recommendation

If Daily Proof Economy and Verified Proof hierarchy are still unstable, run this task next:

> Daily Proof Economy + Verified Proof Hierarchy Finalization

If those are already stable, run:

> Elite First Session + Viral Share Polish

Then proceed to:

1. Challenge System v1.
2. Pro Monetization Optimization.
3. Brand Rewards Foundation.

## Phase A: Ship-Ready Beta

Goal:

Prove the core loop works for real testers.

Scope:

- Email auth.
- Onboarding.
- Daily Proofs.
- Photo Proof.
- Food Proof.
- Health Proof.
- Home score.
- Proof feed.
- Profile.
- Timeline.
- Basic leaderboard.
- Share cards.
- Dev diagnostics.

Do not overbuild:

- Full challenges.
- Brand rewards.
- Complex Pro analytics.
- Full video reels.
- Wearable connectors beyond coming-soon.

Exit criteria:

- Real iPhone smoke test passes.
- Supabase migrations applied.
- RLS/storage verified.
- First proof under 2 minutes.
- Share card works.
- Pending scoring never crashes.
- TestFlight blockers documented.

## Phase B: Viral Social

Goal:

Make proof socially contagious.

Build:

- Friend comparison.
- Challenge friend CTA.
- Better share templates.
- Fully Dialed animation.
- Smart notifications.
- Daily/weekly rank cards.
- Friend proof-event feed polish.

Key screens:

- Home social teaser.
- Friend profile.
- Leaderboard.
- Share preview.
- Notifications.

Exit criteria:

- User can see who they are beating.
- User can share rank or comparison.
- User can challenge or invite a friend.
- Notifications are contextual and proof-native.

## Phase C: Quantified Data Power

Goal:

Make Dialed feel more trustworthy and personalized.

Build:

- Deeper Apple Health scoring.
- Food macro history.
- Proof confidence.
- Location verification.
- Weekly recaps.
- Wearable connector architecture.

Do not fake:

- Oura.
- WHOOP.
- Garmin.
- Fitbit.
- Strava.

Exit criteria:

- Health Proof scoring explains points.
- Food Proof analysis is cached and understandable.
- Weekly Recap works with template fallback.
- Location Proof is privacy-safe.

## Phase D: Monetization

Goal:

Make Pro feel like more ways to become Dialed.

Build:

- Pro proof capacity.
- Premium templates.
- Advanced Food Analysis.
- Reels export.
- Weekly insights.
- Private groups/challenges.
- Leaderboard filters.
- Friend comparison filters.
- Streak freeze.

Paywall copy:

- "Become dangerously consistent."
- "Unlock more ways to prove the day."
- "More capacity. Deeper scoring. Better artifacts."

Fairness guardrails:

- Free remains playable.
- Ranked caps protect competition.
- Manual Notes remain low ranked value.
- Pro does not simply buy first place.

Exit criteria:

- Pro entitlement is server-backed.
- RevenueCat webhook is deployed.
- Pro status survives app restart.
- Paywall has clear value and no aggressive dead end.

## Phase E: Brand Ecosystem

Goal:

Turn proof into rewards and partnerships.

Build:

- Partner challenges.
- Discount rewards.
- Product drops.
- Creator challenges.
- Gym/studio campaigns.
- Ambassador leagues.

Start with:

- Badges.
- Titles.
- Premium templates.
- Non-random partner rewards.
- Partner challenge result cards.

Avoid early:

- Raffles.
- Sweepstakes.
- Complex legal reward mechanics.
- Medical/health outcome claims.

Exit criteria:

- Rewards do not introduce legal risk.
- Partner challenge proof requirements are clear.
- Reward cards are shareable.
- Brand layer reinforces core loop instead of distracting from it.

## Recommended Codex Task Sequence

### Task 1: Daily Proof Economy + Verified Proof Hierarchy Finalization

Goal:

Make proof spend, proof trust, Manual Note policy, and ranked fairness airtight.

Acceptance:

- Manual Note spends 0 Proofs.
- Verified Proof spends 1 Proof.
- Out-of-Proofs state is clear.
- Ranked score favors verified proof.
- Pro capacity exists but fairness caps are documented/enforced.

### Task 2: Elite First Session + Viral Share Polish

Goal:

Make the first two minutes clear and exciting.

Acceptance:

- Onboarding under 60 seconds.
- First proof under 30 seconds after onboarding.
- Reward card is satisfying.
- Share CTA appears after proof.
- Home updates clearly.
- Friend/invite CTA appears naturally.

### Task 3: Challenge System v1

Goal:

Create retention through time-boxed proof games.

Acceptance:

- User can join challenge.
- Challenge has proof requirements.
- Challenge leaderboard works.
- Challenge result card can be shared.
- Private friend challenges can be Pro-gated later.

### Task 4: Pro Monetization Optimization

Goal:

Make Pro value clear without blocking the free game.

Acceptance:

- Pro unlocks capacity/depth/artifacts.
- RevenueCat state is reliable.
- Paywall copy is sharp.
- Proof limit upsell works.
- Premium templates/analysis are clear.

### Task 5: Brand Rewards Foundation

Goal:

Prepare rewards without legal complexity.

Acceptance:

- Badges/titles/templates can be awarded.
- Partner challenge model is documented.
- Reward result cards exist.
- No raffle/sweepstakes logic is added.

## Roadmap Metrics

Phase A metrics:

- Signup to first proof.
- First proof time.
- Daily Proof usage.
- Proof submit success.
- Share card export.

Phase B metrics:

- Friends added.
- Reactions.
- Leaderboard views.
- Friend comparisons.
- Invites.

Phase C metrics:

- Food Proof adoption.
- Health Proof adoption.
- Analysis cache hit rate.
- Weekly Recap opens.

Phase D metrics:

- Paywall views.
- Pro conversion.
- Proof-limit upgrade clicks.
- Premium template clicks.

Phase E metrics:

- Challenge joins.
- Reward redemptions.
- Partner card shares.
- Referral signups.

## Non-Negotiables

- Proof > promises.
- Daily Proofs are finite.
- Manual Notes are context.
- Verified proof drives score.
- Home answers the daily status questions.
- Sharing feels like status.
- AI stays server-side.
- Health data stays private by default.
- Pro expands power without wrecking fairness.
