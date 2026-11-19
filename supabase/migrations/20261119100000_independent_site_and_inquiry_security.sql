-- Independent public inquiry submission and admin allowlist hardening.
-- Public users may create pending inquiries only; reading/updating/deleting remains admin-only.
drop policy if exists "Admins can change their allowlisted email" on public.admins;
drop policy if exists "Public can submit showroom inquiries" on public.inquiries;

create policy "Public can submit showroom inquiries"
on public.inquiries
for insert
to anon, authenticated
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

-- Remove old B12 CDN references from records already seeded in Supabase.
update public.vehicles
set main_image = '/images/vehicle-placeholder.jpg'
where main_image like '%b12.io%';

-- Remove old B12-hosted gallery URLs while preserving locally hosted and other valid images.
update public.vehicles v
set gallery_json = coalesce((
  select jsonb_agg(item)
  from jsonb_array_elements(v.gallery_json) as item
  where item #>> '{}' not like '%b12.io%'
), '[]'::jsonb)
where jsonb_typeof(v.gallery_json) = 'array'
  and v.gallery_json::text like '%b12.io%';

update public.brands
set logo_url = null
where logo_url like '%b12.io%';

update public.settings
set value = jsonb_set(value, '{banner}', '"/images/showroom-banner.jpg"'::jsonb, true)
where key = 'assets' and value->>'banner' like '%b12.io%';

update public.settings
set value = jsonb_set(value, '{og_image}', '"/images/showroom-social.jpg"'::jsonb, true)
where key = 'assets' and value->>'og_image' like '%b12.io%';

update public.settings
set value = jsonb_set(value, '{logo}', '""'::jsonb, true)
where key = 'assets' and value->>'logo' like '%b12.io%';

update public.settings
set value = jsonb_set(value, '{favicon}', '""'::jsonb, true)
where key = 'assets' and value->>'favicon' like '%b12.io%';
