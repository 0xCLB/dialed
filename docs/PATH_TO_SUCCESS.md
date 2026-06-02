# Dialed Self Path To Success

## Purpose

This document turns the elite viral product direction into an execution path. It should guide future Codex tasks after the current beta implementation queue.

The goal is to make the first two minutes impossible to misunderstand and the first proof impossible not to share.

## Success Definition

Dialed Self is ready for a serious beta when a new iPhone tester can:

1. Sign up with email/password.
2. Complete onboarding in under 60 seconds.
3. Understand Daily Proofs.
4. Log a verified proof.
5. See Dialed Score/pillar/proof count change.
6. Share a proof card.
7. Add or invite friends.
8. Return the next day.

## Product Rules

- Home is a daily status dashboard, not a feed first.
- Log Proof is the central action.
- Daily Proofs are finite and visible.
- Verified Proof beats Manual Note.
- Manual Notes are context, not ranked proof.
- Scoring must work with deterministic fallback.
- AI is server-side only.
- Share cards must feel like status symbols.
- Pro expands capacity/depth, not unfair leaderboard dominance.
- Every major screen needs one obvious action.

## Prioritized Build Checklist

### P0: Beta Core Must Work

- Email auth and session persistence.
- Onboarding gate.
- Profile row created with auth user id.
- Home loads without blank states.
- Daily Proof wallet initializes.
- Photo Proof creates entry/media/storage upload.
- Food Proof saves proof and shows analysis pending/fallback.
- Manual Note saves without spending Daily Proof.
- Health screen handles real-device and simulator states.
- Entry appears on Home after submit.
- Reward card shows points or pending/basic state.
- Share card preview/export works.
- Settings diagnostics show exact failures.

### P1: Beta Core Must Feel Clear

- Onboarding explains product in 10 seconds.
- First proof choices are obvious.
- Home empty state pushes Log First Proof.
- Daily Proof count is visible in Home, Log Proof, Capture, and Success.
- Out-of-proofs state explains earn tomorrow/share/Pro.
- Entry Detail shows proof type, trust, pillar, confidence, and explanation.
- Leaderboard copy says ranked score favors verified proof.
- Share card includes Proof > promises and Get Dialed.

### P2: Viral Social Must Start

- Add friend flow works.
- Friend feed shows proof events.
- Reactions work.
- Daily friends leaderboard works.
- Friend comparison card exists or is stubbed intentionally.
- Share after first proof is obvious.
- Share after Fully Dialed Day is obvious.

### P3: TestFlight Must Be Safe

- Privacy policy URL.
- Terms URL.
- Delete account path.
- App icon final.
- Splash final.
- App Store privacy nutrition draft.
- HealthKit capability validated in development build.
- No secret keys committed.
- Supabase migrations applied and reviewed.
- RLS smoke-tested.
- Storage buckets/policies verified.

## Phase A: Ship-Ready Beta

Objective:

Ship a beta where the core loop works and testers understand the product quickly.

Required surfaces:

- Email auth.
- Onboarding.
- Daily Proofs.
- Photo Proof.
- Food Proof.
- Health Proof preview/sync.
- Home score.
- Proof feed.
- Profile.
- Timeline.
- Basic leaderboard.
- Share cards.
- Settings diagnostics.

Acceptance criteria:

- New tester logs first proof within 2 minutes.
- Manual Note does not affect ranked score meaningfully.
- Pending scoring never crashes.
- Food Analysis missing function does not block proof.
- HealthKit unavailable state is elegant.
- Share card can be generated from a proof.

Next Codex task if Phase A is not done:

> Daily Proof Economy + Verified Proof Hierarchy Finalization

## Phase B: Viral Social

Objective:

Make proof socially contagious.

Build:

- Friend comparison.
- Challenge friend CTA.
- Better share templates.
- Fully Dialed animation.
- Smart notifications.
- Daily/weekly rank cards.
- Friend feed proof-event copy.

Acceptance criteria:

- User can compare with a friend.
- User can share a rank card.
- User can see friend pressure on Home.
- Notifications are social/contextual, not generic reminders.

Next Codex task:

> Elite First Session + Viral Share Polish

## Phase C: Quantified Data Power

Objective:

Make Dialed feel smarter and more trustworthy.

Build:

- Deeper Apple Health scoring.
- Food macro history.
- Proof confidence display.
- Location verification.
- Weekly recaps.
- Wearable connector architecture.

Acceptance criteria:

- Health Proof can explain why points were awarded.
- Food Proof can show cached macro history.
- Location Proof uses privacy-safe place labels.
- Weekly Recap works without requiring AI.
- No fake wearable data appears.

Next Codex task:

> Quantified Proof + Weekly Recap v1

## Phase D: Monetization

Objective:

Make Pro feel like more ways to become Dialed.

Build:

- Pro proof capacity.
- Premium templates.
- Advanced Food Analysis.
- Reels export.
- Weekly insights.
- Private groups/challenges.
- Friend comparison filters.
- Streak freeze.

Acceptance criteria:

- Free users still compete fairly.
- Pro unlocks more depth/capacity/status.
- Pro does not simply buy leaderboard dominance.
- Paywall copy is confident but not aggressive.

Next Codex task:

> Pro Monetization Optimization v1

## Phase E: Brand Ecosystem

Objective:

Turn Dialed proof into a rewards layer.

Build:

- Partner challenges.
- Discount rewards.
- Product drops.
- Creator challenges.
- Gym/studio campaigns.
- Ambassador leagues.

Acceptance criteria:

- Rewards are non-random at first.
- Legal risk is avoided.
- Partner challenge mechanics are clear.
- Brand rewards do not undermine the core game.

Next Codex task:

> Brand Rewards Foundation v1

## Two-Minute User Path

The desired first session:

1. User signs up.
2. User sees "How Dialed are you today?"
3. User learns "Use Daily Proofs to prove healthy actions."
4. User creates username.
5. User lands on first-proof chooser.
6. User picks Food Proof or Photo Proof.
7. User submits proof.
8. User sees points/pillar/confidence/pending state.
9. User sees Daily Proof count change.
10. User sees share card CTA.
11. User opens Home and sees score/pillars/proof.
12. User gets prompted to add friends or share.

## Risk Register

- Supabase migrations not applied: app shows setup-required states.
- Edge Functions not deployed: app must use pending/basic fallback states.
- HealthKit unavailable: app must show real-device requirement.
- Food Analysis unavailable: proof still saves and analysis is pending.
- Pro overpowered: ranked caps and trust weighting must protect fairness.
- Too many screens: Home and Log Proof must remain the main loop.
- Share cards look like receipts: prioritize status visuals and minimal copy.

## Recommended Next Code Task

If current implementation already includes Daily Proof Economy and proof hierarchy:

> Build Dialed Self Elite First Session + Viral Share Polish v1.

If Daily Proof economy/proof hierarchy is still unstable:

> Build Dialed Self Daily Proof Economy + Verified Proof Hierarchy Finalization v1.

## Definition Of Done For The Next Code Task

- App compiles.
- New user can complete first proof in under 2 minutes.
- Verified proof updates Home.
- Manual Note is clearly context-only.
- Share card CTA appears after proof.
- Settings diagnostics identify auth/profile/proof/storage/scoring/food/HealthKit issues.
- Docs reflect remaining blockers.
