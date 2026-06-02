# Supabase Manual Steps

Use this when Supabase MCP tools are not visible in the running Codex session.

## 1. Confirm Project

Confirm the active project ref is:

```text
yifbscfdazoqqzxxzeaj
```

## 2. Verify Tables And RLS

Open Supabase SQL Editor and run the verification queries from `docs/SUPABASE_MIGRATION_PLAN.md`.

Do not run `supabase/schema.sql` unless the verification proves the app tables are missing or an additive migration has been reviewed.

## 3. Verify Buckets

In Supabase Storage, confirm or create:

- `entry-photos`, private
- `share-assets`, private
- `avatars`, public or private with public read policy

After buckets exist, review and run:

```text
supabase/storage-policies.sql
```

## 4. Apply Daily Proof Migration

Open `supabase/migrations/daily_proof_economy.sql`, copy the SQL contents, and paste those contents into Supabase SQL Editor.

Do not paste this path as the query:

```text
supabase/migrations/daily_proof_economy.sql
```

That is a filename, not SQL, and Supabase will fail with a syntax error.

After running the SQL, verify:

- `proof_wallets` exists with RLS enabled.
- `proof_transactions` exists with RLS enabled.
- Authenticated users can read their own wallet and transactions.
- Direct client writes to the Proof tables are blocked.
- Authenticated users can execute:
  - `initialize_today_proof_wallet`
  - `spend_proof_for_entry`
  - `earn_bonus_proof`
  - `refund_proof_for_entry`

## 5. Configure Auth

In Authentication settings:

- Enable Email provider.
- For local development only, disable email confirmation if immediate sign-up/onboarding is desired.
- Keep Phone provider/Twilio deferred until production SMS testing.
- Keep Apple Sign-In deferred until App Store launch prep.

## 6. Configure Edge Function Secrets

Set these in Supabase, never in repo files:

- `OPENAI_API_KEY`
- `OPENAI_SCORING_MODEL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REVENUECAT_WEBHOOK_AUTH`
- `DIALED_INTERNAL_FUNCTION_TOKEN`

## 7. Deploy Edge Functions Later

Deploy only after SQL, RLS, storage policies, and secrets are verified:

- `score-entry`
- `generate-digest`
- `create-share-card`
- `send-smart-notification`
- `sync-revenuecat-webhook`

For the first real-device beta smoke, `score-entry` can remain undeployed only if pending-score behavior is accepted. Deploy it before claiming the full Dialed Score loop.
