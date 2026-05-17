# Storage Buckets

These notes are for local and production Supabase setup. Keep buckets private by default unless a
product path intentionally needs public distribution.

## Buckets

| Bucket | Purpose | Expected path | Public |
| --- | --- | --- | --- |
| `entry-photos` | Original user photo proof uploads. | `entry-photos/{user_id}/{entry_id}.jpg` | No |
| `share-assets` | Generated share cards, leaderboard cards, and reel exports. | `share-assets/{user_id}/{asset_id}.png` | No by default |
| `avatars` | User profile avatars. | `avatars/{user_id}/avatar.jpg` | Yes |

## Bucket Setup SQL

Run this after the Supabase project has the Storage schema available.

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('entry-photos', 'entry-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/heic']),
  ('share-assets', 'share-assets', false, 10485760, array['image/png', 'image/jpeg', 'video/mp4']),
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
```

## Policy Setup SQL

The first path segment must be the authenticated user's UUID. This enforces own-folder writes and
own-file reads for private buckets.

```sql
create policy "Users upload their own entry photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'entry-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users read their own entry photos"
on storage.objects for select to authenticated
using (
  bucket_id = 'entry-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users upload their own share assets"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'share-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users read their own share assets"
on storage.objects for select to authenticated
using (
  bucket_id = 'share-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users upload their own avatar"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users update their own avatar"
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Avatars are publicly readable"
on storage.objects for select to public
using (bucket_id = 'avatars');
```

## Security Notes

- Authenticated users can upload only to their own folder by matching the first path segment to
  `auth.uid()`.
- Users can read their own private files in `entry-photos` and `share-assets`.
- Avatars can be publicly readable because the bucket is configured as public and has a public
  read policy.
- Entry photo access must respect `entries.visibility`. Storage policies are a poor fit for the
  full visibility model because friends and public access require social graph and entry metadata
  checks.
- Use signed URLs from a Supabase Edge Function for non-owner entry photo access. The Edge Function
  should verify entry ownership, friendship status, and `private` / `friends` / `public` visibility
  before creating a short-lived signed URL.
- Public share assets may be readable if intentionally generated for sharing. Keep `share-assets`
  private by default and issue signed URLs, or move explicitly public exports into a separate public
  path after product review.
