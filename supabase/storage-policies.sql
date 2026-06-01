-- Dialed Self storage access policies.
-- Apply after buckets exist and after supabase/policies.sql has created
-- public.can_view_entry(viewer uuid, target_entry_id uuid).
--
-- Expected bucket-relative object names:
-- - entry-photos/{user_id}/{entry_id}/{media_id}.{jpg|jpeg|png|heic|webp}
-- - share-assets/{user_id}/{asset_id}.{png|jpg|jpeg|mp4}
-- - avatars/{user_id}/avatar.{jpg|jpeg|png|webp}

drop policy if exists "entry_photos_insert_own_folder" on storage.objects;
create policy "entry_photos_insert_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'entry-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'heic', 'webp')
  and name ~ (
    '^'
    || auth.uid()::text
    || '/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\.(jpg|jpeg|png|heic|webp)$'
  )
);

drop policy if exists "entry_photos_select_own_folder" on storage.objects;
create policy "entry_photos_select_own_folder"
on storage.objects for select
to authenticated
using (
  bucket_id = 'entry-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "entry_photos_select_visible_entry" on storage.objects;
create policy "entry_photos_select_visible_entry"
on storage.objects for select
to authenticated
using (
  bucket_id = 'entry-photos'
  and exists (
    select 1
    from public.entry_media em
    where em.bucket_id = 'entry-photos'
      and em.storage_path = 'entry-photos/' || name
      and public.can_view_entry(auth.uid(), em.entry_id)
  )
);

drop policy if exists "entry_photos_update_own_folder" on storage.objects;
create policy "entry_photos_update_own_folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'entry-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'entry-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "entry_photos_delete_own_folder" on storage.objects;
create policy "entry_photos_delete_own_folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'entry-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "share_assets_insert_own_folder" on storage.objects;
create policy "share_assets_insert_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'share-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
  and lower(storage.extension(name)) in ('png', 'jpg', 'jpeg', 'mp4')
  and name ~ (
    '^'
    || auth.uid()::text
    || '/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\.(png|jpg|jpeg|mp4)$'
  )
);

drop policy if exists "share_assets_select_own_folder" on storage.objects;
create policy "share_assets_select_own_folder"
on storage.objects for select
to authenticated
using (
  bucket_id = 'share-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "share_assets_select_public_asset" on storage.objects;
create policy "share_assets_select_public_asset"
on storage.objects for select
to public
using (
  bucket_id = 'share-assets'
  and exists (
    select 1
    from public.share_assets sa
    where sa.storage_path = 'share-assets/' || name
      and sa.visibility = 'public'
      and sa.status = 'ready'
  )
);

drop policy if exists "share_assets_update_own_folder" on storage.objects;
create policy "share_assets_update_own_folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'share-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'share-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "share_assets_delete_own_folder" on storage.objects;
create policy "share_assets_delete_own_folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'share-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_insert_own_path" on storage.objects;
create policy "avatars_insert_own_path"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
  and name ~ (
    '^'
    || auth.uid()::text
    || '/avatar\.(jpg|jpeg|png|webp)$'
  )
);

drop policy if exists "avatars_update_own_path" on storage.objects;
create policy "avatars_update_own_path"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars_select_public" on storage.objects;
create policy "avatars_select_public"
on storage.objects for select
to public
using (bucket_id = 'avatars');

drop policy if exists "avatars_delete_own_path" on storage.objects;
create policy "avatars_delete_own_path"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
