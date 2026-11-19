-- Limit storage object listing to allowlisted admins; public media URLs remain readable.
-- Affected tables: storage.objects policies for the public showroom media bucket.
drop policy if exists "Public reads showroom media" on storage.objects;
create policy "Admins list showroom media" on storage.objects for select to authenticated using(bucket_id='negin-uploads' and exists(select 1 from public.admins a where a.email=(select auth.jwt()->>'email')));
