# Dialed Self Proof Economy

Status: v1 app/migration implementation added on 2026-06-01.

Daily Proofs make Dialed Self feel like a game instead of unlimited health tracking. A Proof is one scoring attempt/loggable proof. Manual check-ins, photo proofs, and future health proofs spend one Proof unless the entry is marked `proof_consumption = free` or `system`.

## Allowance

- Free: 5 base Daily Proofs.
- Pro: 20 base Daily Proofs.
- Free bonus cap: +3 earned Proofs per day.
- Pro bonus cap: +5 earned Proofs per day in v1 so Pro has extra capacity without making competition pointless.

## Database

Apply:

```sql
\i supabase/migrations/daily_proof_economy.sql
```

The migration creates:

- `proof_wallets`
- `proof_transactions`
- RLS read policies for each user to read only their own Proof data
- RPC write paths:
  - `initialize_today_proof_wallet(date)`
  - `spend_proof_for_entry(uuid)`
  - `earn_bonus_proof(text, date, jsonb)`
  - `refund_proof_for_entry(uuid, text)`

Wallets use `(user_id, proof_date)` as the primary key so tomorrow bonuses and historical transactions can coexist. The prompt’s one-row `user_id primary key` shape would overwrite tomorrow rewards, so the migration uses the daily key that matches the product rule.

Client table writes are not opened broadly. The app reads wallets/transactions and spends/earns/refunds through RPC functions that check `auth.uid()`.

## App Flow

1. Home initializes/fetches today’s wallet and shows remaining Daily Proofs.
2. Check-In and Capture fetch the wallet and show a balance pill/card.
3. Submit opens a “Use a Proof” modal.
4. The entry is created first.
5. The app calls `spend_proof_for_entry(entry_id)`.
6. Scoring is requested after the Proof is spent.
7. If scoring is missing or fails, the entry remains pending and the Proof stays spent.
8. If entry creation/upload fails, no Proof is spent.

If the migration has not been applied, the app shows a setup-required state and blocks Proof spending instead of pretending the economy is enforced.

## Earned Proofs

Implemented v1 hooks:

- +1 today for a successful share-card export, max once/day.
- +1 tomorrow for a Fully Dialed Day.
- +1 tomorrow for a 3-day streak.

Placeholder:

- +1 for inviting a friend who signs up. Referral/invite attribution is not built yet.

## Ranked Fairness

Personal progress can use all saved proofs. Ranked daily competition should only count a capped number of ranked proofs:

- Free ranked cap: top 5 ranked proofs/day.
- Pro ranked cap: top 10 ranked proofs/day.

This prevents Pro from becoming “20 proofs beats 5 proofs” by default. Extra Pro Proofs still matter for personal progress, photos, automation, digest quality, and premium status, but leaderboard scoring should aggregate only the top ranked subset once server aggregation is implemented.

Current placeholder logic lives in `features/proofs/proofService.ts` as `RANKED_PROOF_CAPS` and `getRankedProofCap(tier)`. Server aggregation still needs to apply the caps when `daily_scores` is recalculated.

## Manual Supabase Setup

After review, run `supabase/migrations/daily_proof_economy.sql` in the Supabase SQL editor or through the project migration flow.

Because newer Supabase projects may not expose new tables to the Data API automatically, verify:

- `proof_wallets` is exposed/readable to `authenticated`.
- `proof_transactions` is exposed/readable to `authenticated`.
- RLS is enabled on both tables.
- RPC functions are executable by `authenticated`.
- Client insert/update/delete remains blocked for both tables.

## Test Plan

1. Login.
2. Complete onboarding.
3. Open Home and confirm the Daily Proof card appears.
4. Create a manual check-in and confirm remaining Proofs decreases.
5. Create a photo proof and confirm remaining Proofs decreases.
6. Spend all 5 Free Proofs and confirm the out-of-Proofs state appears.
7. Share today’s score/card and confirm +1 bonus appears once.
8. Upgrade/stub Pro and confirm the wallet initializes with 20 base Proofs.
9. Confirm `proof_transactions` has spend/earn/reset rows for the authenticated user only.
10. Confirm private RLS blocks reading another user’s Proof wallet.
