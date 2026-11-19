-- Create Negin Khodro inventory and administration data.
-- Affected tables: admins, brands, categories, vehicles, inquiries, settings.
-- Admin write access is restricted to the explicitly allowlisted email.
create table if not exists public.admins (
  email text primary key,
  created_at timestamptz not null default now()
);
insert into public.admins(email) values ('fitotonomos@gmail.com') on conflict (email) do nothing;

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
  logo_url text, sort_order integer not null default 0, created_at timestamptz not null default now()
);
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
  sort_order integer not null default 0, created_at timestamptz not null default now()
);
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(), slug text not null unique,
  brand_id uuid references public.brands(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  name text not null, model text, trim text, year integer, price numeric, price_visible boolean not null default true,
  engine_cc integer, power_hp integer, fuel_type text, transmission text, drivetrain text, mileage integer,
  exterior_color text, interior_color text, condition text not null default 'used',
  status text not null default 'available', description text, main_image text, gallery_json jsonb not null default '[]'::jsonb,
  featured boolean not null default false, show_on_home boolean not null default false,
  sort_order integer not null default 0, created_at timestamptz not null default now(),
  constraint vehicles_year_check check (year is null or year between 1900 and 2200),
  constraint vehicles_status_check check (status in ('available','reserved','sold','unavailable')),
  constraint vehicles_condition_check check (condition in ('new','used'))
);
create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(), vehicle_id uuid references public.vehicles(id) on delete set null,
  name text not null, phone text not null, message text, status text not null default 'pending', admin_note text,
  created_at timestamptz not null default now(), constraint inquiries_status_check check (status in ('pending','resolved'))
);
create table if not exists public.settings (
  key text primary key, value jsonb not null default 'null'::jsonb, updated_at timestamptz not null default now()
);
create index if not exists vehicles_brand_id_idx on public.vehicles(brand_id);
create index if not exists vehicles_category_id_idx on public.vehicles(category_id);
create index if not exists vehicles_year_idx on public.vehicles(year);
create index if not exists vehicles_price_idx on public.vehicles(price);
create index if not exists vehicles_status_idx on public.vehicles(status);
create index if not exists vehicles_featured_idx on public.vehicles(featured);
create index if not exists vehicles_home_idx on public.vehicles(show_on_home, sort_order);
create index if not exists inquiries_status_created_idx on public.inquiries(status, created_at desc);

alter table public.admins enable row level security;
alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.vehicles enable row level security;
alter table public.inquiries enable row level security;
alter table public.settings enable row level security;

create policy "Authenticated admins can verify their allowlist entry" on public.admins for select to authenticated using (email = (select auth.jwt() ->> 'email'));
create policy "Admins can change their allowlisted email" on public.admins for update to authenticated using (email = (select auth.jwt() ->> 'email')) with check (true);
create policy "Public can read brands" on public.brands for select to anon, authenticated using (true);
create policy "Public can read categories" on public.categories for select to anon, authenticated using (true);
create policy "Public can read available vehicles" on public.vehicles for select to anon, authenticated using (status = 'available' or exists (select 1 from public.admins a where a.email = (select auth.jwt() ->> 'email')));
create policy "Admins manage vehicles" on public.vehicles for all to authenticated using (exists (select 1 from public.admins a where a.email = (select auth.jwt() ->> 'email'))) with check (exists (select 1 from public.admins a where a.email = (select auth.jwt() ->> 'email')));
create policy "Admins manage brands" on public.brands for all to authenticated using (exists (select 1 from public.admins a where a.email = (select auth.jwt() ->> 'email'))) with check (exists (select 1 from public.admins a where a.email = (select auth.jwt() ->> 'email')));
create policy "Admins manage categories" on public.categories for all to authenticated using (exists (select 1 from public.admins a where a.email = (select auth.jwt() ->> 'email'))) with check (exists (select 1 from public.admins a where a.email = (select auth.jwt() ->> 'email')));
create policy "Admins manage inquiries" on public.inquiries for all to authenticated using (exists (select 1 from public.admins a where a.email = (select auth.jwt() ->> 'email'))) with check (exists (select 1 from public.admins a where a.email = (select auth.jwt() ->> 'email')));
create policy "Public can read settings" on public.settings for select to anon, authenticated using (true);
create policy "Admins manage settings" on public.settings for all to authenticated using (exists (select 1 from public.admins a where a.email = (select auth.jwt() ->> 'email'))) with check (exists (select 1 from public.admins a where a.email = (select auth.jwt() ->> 'email')));
