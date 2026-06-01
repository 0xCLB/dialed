# Supabase Migration Plan

## Current Finding

The connected project ref `yifbscfdazoqqzxxzeaj` already responds successfully for all expected Dialed public table endpoints. Treat the database as existing infrastructure until a privileged diff proves otherwise.

## Safe Next Steps

1. Use Supabase MCP after Codex reloads the authenticated server, or use the Supabase SQL editor.
2. Export the current table, column, constraint, index, trigger, RLS, and policy state.
3. Compare the exported state against:
   - `supabase/schema.sql`
   - `supabase/policies.sql`
   - `supabase/storage-policies.sql`
4. Categorize differences:
   - Missing safe additive objects.
   - Existing objects that match.
   - Existing objects with incompatible definitions.
   - Destructive changes that need data migration or manual review.
5. Apply only non-destructive additive changes first.
6. Re-run verification after each migration step.

## Do Not Do Yet

- Do not drop tables.
- Do not rename columns.
- Do not overwrite policies without confirming their current definitions.
- Do not deploy Edge Functions with production secrets until SQL and RLS are verified.
- Do not run `supabase/seed.sql` against production data.

## Candidate Verification SQL

Run these manually or via privileged MCP:

```sql
select extname
from pg_extension
where extname = 'pgcrypto';

select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles',
    'activity_catalog',
    'user_quick_picks',
    'entries',
    'entry_media',
    'entry_scores',
    'daily_scores',
    'streaks',
    'friendships',
    'user_blocks',
    'reactions',
    'comments',
    'challenges',
    'challenge_members',
    'challenge_entries',
    'health_samples',
    'daily_digests',
    'share_assets',
    'notification_devices',
    'notification_preferences',
    'notifications',
    'subscriptions',
    'subscription_events'
  )
order by tablename;

select schemaname, tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

## Bucket Verification

Verify buckets with Supabase dashboard, MCP, or privileged storage APIs:

- `entry-photos` should be private.
- `share-assets` should be private.
- `avatars` can be public or private with a public-read policy.

Apply `supabase/storage-policies.sql` only after buckets exist.
