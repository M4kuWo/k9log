-- Storage bucket for dog avatar photos. Objects are keyed by
-- "<dog_id>/<filename>" so RLS can scope writes to the uploader's own
-- household via the existing is_dogs_household_member() helper (see
-- 0001_init.sql). Public read since avatars aren't sensitive and a plain
-- public URL is simplest for <Image> to consume.

insert into storage.buckets (id, name, public)
values ('dog-photos', 'dog-photos', true)
on conflict (id) do nothing;

create policy "anyone can view dog photos"
  on storage.objects for select
  using (bucket_id = 'dog-photos');

create policy "household members can upload their dogs' photos"
  on storage.objects for insert
  with check (
    bucket_id = 'dog-photos'
    and is_dogs_household_member((storage.foldername(name))[1]::uuid)
  );

create policy "household members can replace their dogs' photos"
  on storage.objects for update
  using (
    bucket_id = 'dog-photos'
    and is_dogs_household_member((storage.foldername(name))[1]::uuid)
  );

create policy "household members can remove their dogs' photos"
  on storage.objects for delete
  using (
    bucket_id = 'dog-photos'
    and is_dogs_household_member((storage.foldername(name))[1]::uuid)
  );
