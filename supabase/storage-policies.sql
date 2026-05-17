-- Dialed Self storage access policies.
-- Apply after storage buckets exist and after supabase/policies.sql has created
-- public.can_view_entry(viewer uuid, target_entry_id uuid).
--
-- Expected bucket-relative object names:
-- - entry-photos/{auth.uid()}/{entry_id}.jpg
-- - share-assets/{auth.uid()}/{asset_id}.png
-- - avatars/{auth.uid()}/avatar.jpg

-- entry-photos: authenticated users can upload original proof photos only to
-- their own folder, using the expected {user_id}/{entry_id}.jpg path.
drop policy if exists "entry_photos_insert_own_folder" on storage.objects;
create policy "entry_photos_insert_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'entry-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
  and lower(storage.extension(name)) = 'jpg'
  and name ~ (
    '^'
    || auth.uid()::text
    || '/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\.jpg$'
  )
);

-- entry-photos: authenticated users can read their own proof photos directly.
drop policy if exists "entry_photos_select_own_folder" on storage.objects;
create policy "entry_photos_select_own_folder"
on storage.objects for select
to authenticated
using (
  bucket_id = 'entry-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- entry-photos: public/friend reads must respect the related entry visibility.
-- The policy maps {user_id}/{entry_id}.jpg back to entries.photo_url and then
-- delegates owner/public/friends checks to public.can_view_entry.
drop policy if exists "entry_photos_select_visible_entry" on storage.objects;
create policy "entry_photos_select_visible_entry"
on storage.objects for select
to authenticated
using (
  bucket_id = 'entry-photos'
  and lower(storage.extension(name)) = 'jpg'
  and exists (
    select 1
    from public.entries e
    where e.photo_url = 'entry-photos/' || name
      and e.user_id::text = (storage.foldername(name))[1]
      and e.id::text = regexp_replace(storage.filename(name), '\.jpg$', '')
      and public.can_view_entry(auth.uid(), e.id)
  )
);

-- entry-photos: if storage-policy joins become too limited for richer visibility
-- rules, serve non-owner entry photos through a Supabase Edge Function that
-- verifies entry visibility and returns a short-lived signed URL.

-- entry-photos: users can delete their own proof photos.
drop policy if exists "entry_photos_delete_own_folder" on storage.objects;
create policy "entry_photos_delete_own_folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'entry-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- share-assets: authenticated users can upload generated cards and reels only
-- to their own folder, using the expected {user_id}/{asset_id}.png path.
drop policy if exists "share_assets_insert_own_folder" on storage.objects;
create policy "share_assets_insert_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'share-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
  and lower(storage.extension(name)) = 'png'
  and name ~ (
    '^'
    || auth.uid()::text
    || '/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\.png$'
  )
);

-- share-assets: owners can read their own generated share assets.
drop policy if exists "share_assets_select_own_folder" on storage.objects;
create policy "share_assets_select_own_folder"
on storage.objects for select
to authenticated
using (
  bucket_id = 'share-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- share-assets: intentionally public share exports can be read publicly when
-- object metadata marks them as public. Keep the bucket private by default.
drop policy if exists "share_assets_select_public_metadata" on storage.objects;
create policy "share_assets_select_public_metadata"
on storage.objects for select
to public
using (
  bucket_id = 'share-assets'
  and (
    metadata->>'visibility' = 'public'
    or metadata->>'public' = 'true'
  )
);

-- share-assets: users can delete their own generated share assets.
drop policy if exists "share_assets_delete_own_folder" on storage.objects;
create policy "share_assets_delete_own_folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'share-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- avatars: authenticated users can upload only their own avatar at the exact
-- expected {user_id}/avatar.jpg path.
drop policy if exists "avatars_insert_own_path" on storage.objects;
create policy "avatars_insert_own_path"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
  and name = auth.uid()::text || '/avatar.jpg'
);

-- avatars: authenticated users can update only their own avatar path.
drop policy if exists "avatars_update_own_path" on storage.objects;
create policy "avatars_update_own_path"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
  and name = auth.uid()::text || '/avatar.jpg'
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
  and name = auth.uid()::text || '/avatar.jpg'
);

-- avatars: profile avatars are public so social profile cards can render
-- without issuing signed URLs.
drop policy if exists "avatars_select_public" on storage.objects;
create policy "avatars_select_public"
on storage.objects for select
to public
using (bucket_id = 'avatars');

-- avatars: users can delete their own avatar.
drop policy if exists "avatars_delete_own_path" on storage.objects;
create policy "avatars_delete_own_path"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
  and name = auth.uid()::text || '/avatar.jpg'
);
