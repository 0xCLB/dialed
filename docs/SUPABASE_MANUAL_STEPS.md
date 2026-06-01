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

## 4. Configure Auth

In Authentication settings:

- Confirm Phone provider is enabled.
- Confirm Twilio credentials are configured in Supabase.
- Keep phone autoconfirm disabled for real SMS OTP testing.

## 5. Configure Edge Function Secrets

Set these in Supabase, never in repo files:

- `OPENAI_API_KEY`
- `OPENAI_SCORING_MODEL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REVENUECAT_WEBHOOK_AUTH`
- `DIALED_INTERNAL_FUNCTION_TOKEN`

## 6. Deploy Edge Functions Later

Deploy only after SQL, RLS, storage policies, and secrets are verified:

- `score-entry`
- `generate-digest`
- `create-share-card`
- `send-smart-notification`
- `sync-revenuecat-webhook`
