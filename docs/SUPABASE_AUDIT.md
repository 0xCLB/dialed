# Supabase Audit

Project ref checked: `yifbscfdazoqqzxxzeaj`

## MCP Status

- `codex mcp list` shows a `supabase` MCP server configured for `https://mcp.supabase.com/mcp?project_ref=yifbscfdazoqqzxxzeaj`.
- The server is enabled and authenticated with OAuth.
- The current running Codex agent session does not expose callable Supabase MCP tools after installation. A Codex restart or new thread may be needed before MCP project/database tools are available to the agent.
- Because callable MCP tools were unavailable in this session, no SQL was applied through MCP.

## Read-Only Checks Performed

The following checks used Supabase public endpoints and the provided anon key in-process only. The key was not written to repo files.

## Public Table Endpoints

The expected public table endpoints returned HTTP 200:

- `profiles`
- `activity_catalog`
- `user_quick_picks`
- `entries`
- `entry_media`
- `entry_scores`
- `daily_scores`
- `streaks`
- `friendships`
- `user_blocks`
- `reactions`
- `comments`
- `challenges`
- `challenge_members`
- `challenge_entries`
- `health_samples`
- `daily_digests`
- `share_assets`
- `notification_devices`
- `notification_preferences`
- `notifications`
- `subscriptions`
- `subscription_events`

This confirms PostgREST can see those tables or views. It does not prove every column, constraint, index, trigger, or RLS policy matches `supabase/schema.sql`.

## Extensions

- `pgcrypto` could not be verified through anon/public access.
- It should be verified with Supabase MCP, SQL editor, or a privileged SQL query before further migrations.

## RLS

- RLS status could not be verified through anon/public access.
- `supabase/policies.sql` enables RLS for all app-owned tables and uses `auth.uid()` in policies.
- A privileged audit should confirm `pg_class.relrowsecurity = true` for each app table before launch.

## Storage Buckets

Read-only bucket listing returned an empty list through anon access.

This may mean buckets do not exist, or private bucket metadata is not visible to anon. Privileged verification is still required for:

- `entry-photos`
- `share-assets`
- `avatars`

## Auth Settings

Readable auth settings indicate:

- Signup is not disabled.
- SMS provider reports as `twilio`.
- Phone autoconfirm is false.
- Email is enabled as an external provider.

This suggests phone OTP infrastructure is at least partially configured, but an actual OTP smoke test should be performed manually with a test phone number.

## Edge Functions

Read-only function checks returned HTTP 404 for all target functions:

- `score-entry`
- `generate-digest`
- `create-share-card`
- `send-smart-notification`
- `sync-revenuecat-webhook`

They should be treated as not deployed until privileged Supabase tooling proves otherwise.

## Conclusion

Do not apply `schema.sql` blindly. The database already exposes the expected Dialed table names. Next step is a privileged schema/RLS/storage audit through Supabase MCP after tools are visible in Codex, or through the Supabase SQL editor.
