# Storage Buckets

These notes are for local and production Supabase setup. Keep proof and generated media private by
default, then grant access through RLS-backed storage policies or short-lived signed URLs.

## Buckets

| Bucket | Purpose | Expected path | Public |
| --- | --- | --- | --- |
| `entry-photos` | Original user proof uploads and thumbnails. | `entry-photos/{user_id}/{entry_id}/{media_id}.{jpg|jpeg|png|heic|webp}` | No |
| `share-assets` | Generated story cards, leaderboard cards, digest cards, and reels. | `share-assets/{user_id}/{asset_id}.{png|jpg|jpeg|mp4}` | No |
| `avatars` | User profile avatars. | `avatars/{user_id}/avatar.{jpg|jpeg|png|webp}` | Yes |

## Bucket Setup SQL

Run this after creating the Supabase project and before applying `supabase/storage-policies.sql`.

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('entry-photos', 'entry-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/heic', 'image/webp']),
  ('share-assets', 'share-assets', false, 52428800, array['image/png', 'image/jpeg', 'video/mp4']),
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
```

## Policy Files

Apply files in this order:

1. `supabase/schema.sql`
2. `supabase/policies.sql`
3. Bucket setup SQL above
4. `supabase/storage-policies.sql`
5. Optional dev-only `supabase/seed.sql`

## Access Model

- `entry-photos` writes are constrained to the authenticated user's folder.
- Non-owner `entry-photos` reads are allowed only when `public.can_view_entry(auth.uid(), entry_id)` passes through the matching `entry_media` row.
- `share-assets` writes are constrained to the authenticated user's folder.
- Public `share-assets` reads require a matching `share_assets` row with `visibility = 'public'` and `status = 'ready'`.
- `avatars` are publicly readable so social profile cards can render without issuing signed URLs.
- Private entries and private share assets should use signed URLs from trusted app flows when direct storage reads are not appropriate.

## Production Notes

- Use deterministic user-scoped paths so storage policies can enforce ownership without trusting client metadata.
- Insert the app row (`entry_media` or `share_assets`) after upload succeeds.
- Delete orphaned storage objects when an entry or share asset is deleted.
- Keep generated reels in `share-assets`; the bucket accepts `video/mp4` for later reel export.
- Do not make `entry-photos` public. Proof media visibility must be tied to entry privacy and friendship state.
