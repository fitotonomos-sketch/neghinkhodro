-- Harden public/admin access without making the admins table public.
-- Existing project policies are replaced as a set so older permissive rules cannot remain active.
begin;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admins as a
    where lower(a.email) = lower((select auth.jwt() ->> 'email'))
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- This is the verified Auth email previously present in the supplied project diagnostics.
-- This inserts only an allowlist record; it does not create an Auth user or bypass email verification.
insert into public.admins(email)
values ('neghinkhodro@gmail.com')
on conflict (email) do nothing;

-- Remove the previous allowlist placeholder only when no Supabase Auth account exists for it.
delete from public.admins as a
where lower(a.email) = 'fitotonomos@gmail.com'
  and not exists (
    select 1 from auth.users as u
    where lower(u.email) = lower(a.email)
  );

alter table public.admins enable row level security;
alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.vehicles enable row level security;
alter table public.inquiries enable row level security;
alter table public.settings enable row level security;

do $$
declare
  item record;
begin
  for item in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('admins', 'brands', 'categories', 'vehicles', 'inquiries', 'settings')
  loop
    execute format('drop policy if exists %I on %I.%I', item.policyname, item.schemaname, item.tablename);
  end loop;
end;
$$;

-- Reset table privileges explicitly; RLS decides which rows are visible or writable.
revoke all privileges on table
  public.admins, public.brands, public.categories, public.vehicles, public.inquiries, public.settings
from anon, authenticated;

grant usage on schema public to anon, authenticated;
grant usage on schema storage to authenticated;
grant select, insert, update, delete on table storage.objects to authenticated;
grant select on table public.admins to authenticated;

grant select on table public.brands, public.categories, public.vehicles, public.settings to anon, authenticated;
grant select, insert, update, delete on table public.brands, public.categories, public.vehicles, public.inquiries, public.settings to authenticated;
grant insert on table public.inquiries to anon;

-- The allowlist is private. Each authenticated account can read only its matching email row.
create policy "admins_select_own_allowlist"
  on public.admins for select to authenticated
  using (lower(email) = lower((select auth.jwt() ->> 'email')));

-- Public inventory reads never reference the private admins table.
create policy "public_read_available_vehicles"
  on public.vehicles for select to anon, authenticated
  using (status = 'available');
create policy "admins_manage_vehicles"
  on public.vehicles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "public_read_brands"
  on public.brands for select to anon, authenticated using (true);
create policy "admins_manage_brands"
  on public.brands for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "public_read_categories"
  on public.categories for select to anon, authenticated using (true);
create policy "admins_manage_categories"
  on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Public visitors may create pending inquiries only; reading and managing them stays private.
create policy "public_submit_pending_inquiries"
  on public.inquiries for insert to anon, authenticated
  with check (
    status = 'pending'
    and admin_note is null
    and vehicle_id is null
    and created_at between now() - interval '1 minute' and now() + interval '1 minute'
    and char_length(trim(name)) between 2 and 100
    and phone ~ '^[0-9]{7,15}$'
    and message is not null
    and char_length(trim(message)) between 2 and 2000
    and (vehicle_name is null or char_length(vehicle_name) <= 150)
  );
create policy "admins_manage_inquiries"
  on public.inquiries for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "public_read_settings"
  on public.settings for select to anon, authenticated using (true);
create policy "admins_manage_settings"
  on public.settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Public bucket URLs remain readable. Listing, upload, update and deletion are admin-only.
-- Remove every existing policy whose predicate mentions this bucket, including
-- locally added policies with names that are not part of the repository history.
do $$
declare
  item record;
begin
  for item in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and (coalesce(qual, '') || ' ' || coalesce(with_check, '')) like '%negin-uploads%'
  loop
    execute format('drop policy if exists %I on storage.objects', item.policyname);
  end loop;
end;
$$;

create policy "admins_select_showroom_media"
  on storage.objects for select to authenticated
  using (bucket_id = 'negin-uploads' and public.is_admin());
create policy "admins_insert_showroom_media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'negin-uploads' and public.is_admin());
create policy "admins_update_showroom_media"
  on storage.objects for update to authenticated
  using (bucket_id = 'negin-uploads' and public.is_admin())
  with check (bucket_id = 'negin-uploads' and public.is_admin());
create policy "admins_delete_showroom_media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'negin-uploads' and public.is_admin());

commit;
