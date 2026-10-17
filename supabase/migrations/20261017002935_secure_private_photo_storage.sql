-- Personal couple photos should not be publicly readable by possession of a URL.
-- This migration is paired with the frontend's authenticated createSignedUrl flow.
-- The current production bucket and photo table were checked before this change;
-- both contained zero objects/rows, so no existing records require URL conversion.

begin;

update storage.buckets
set public = false
where id = 'photos';

drop policy if exists "public can view album photos" on storage.objects;

drop policy if exists "album owners can view photos storage" on storage.objects;

create policy "album owners can view photos storage"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'photos'
  and public.is_photo_album_owner()
);

commit;
