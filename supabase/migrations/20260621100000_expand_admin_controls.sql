-- Expand Negin Khodro management data and create secure private uploads.
-- Affected tables: vehicles, brands, categories, settings, storage.objects.
alter table public.vehicles add column if not exists engine_cc integer;
alter table public.vehicles add column if not exists power_hp integer;
alter table public.vehicles add column if not exists fuel_type text;
alter table public.vehicles add column if not exists transmission text;
alter table public.vehicles add column if not exists drivetrain text;
alter table public.vehicles add column if not exists mileage integer;
alter table public.vehicles add column if not exists exterior_color text;
alter table public.vehicles add column if not exists interior_color text;
alter table public.vehicles add column if not exists price_visible boolean not null default true;
alter table public.vehicles add column if not exists technical_specs jsonb not null default '[]'::jsonb;
alter table public.vehicles add column if not exists seo_title text;
alter table public.vehicles add column if not exists meta_description text;
alter table public.vehicles add column if not exists image_alt text;
alter table public.vehicles add column if not exists updated_at timestamptz not null default now();
alter table public.brands add column if not exists updated_at timestamptz not null default now();
alter table public.categories add column if not exists updated_at timestamptz not null default now();
alter table public.inquiries add column if not exists vehicle_name text;
insert into public.settings(key,value) values
 ('identity', '{"title":"نگین خودرو","tagline":"انتخابی فراتر از انتظار","description":"نمایشگاه تخصصی خودروهای لوکس و خاص"}'::jsonb),
 ('homepage', '{"hero_title":"انتخابی فراتر از انتظار","hero_subtitle":"مقصدی برای یافتن خودروهای ممتاز","hero_button":"مشاهده خودروهای موجود","hero_link":"/vehicles/"}'::jsonb),
 ('contact', '{"phone":"02188714070","email":"hello@neginkhodro.ir","address":"تهران، خیابان فرشته، پلاک ۲۴","hours":"شنبه تا پنجشنبه، ۹ تا ۲۰","whatsapp":"989121234567"}'::jsonb),
 ('social', '{"instagram":"","telegram":"","youtube":"","x":""}'::jsonb),
 ('footer', '{"description":"نگین خودرو؛ همراه شما در انتخاب، بررسی و خرید خودروهای ممتاز.","copyright":"© ۱۴۰۵ نگین خودرو. تمامی حقوق محفوظ است."}'::jsonb),
 ('floating', '{"whatsapp_enabled":true,"whatsapp_message":"سلام، برای مشاوره خرید خودرو پیام می‌دهم.","guide_enabled":true,"guide_link":"/guide/"}'::jsonb),
 ('content', '{}'::jsonb)
on conflict(key) do nothing;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('negin-uploads','negin-uploads',true,5242880,array['image/jpeg','image/png','image/webp','image/x-icon','image/vnd.microsoft.icon'])
on conflict(id) do nothing;
create policy "Public reads showroom media" on storage.objects for select to anon, authenticated using(bucket_id='negin-uploads');
create policy "Admins upload showroom media" on storage.objects for insert to authenticated with check(bucket_id='negin-uploads' and exists(select 1 from public.admins a where a.email=(select auth.jwt()->>'email')));
create policy "Admins update showroom media" on storage.objects for update to authenticated using(bucket_id='negin-uploads' and exists(select 1 from public.admins a where a.email=(select auth.jwt()->>'email'))) with check(bucket_id='negin-uploads' and exists(select 1 from public.admins a where a.email=(select auth.jwt()->>'email')));
create policy "Admins delete showroom media" on storage.objects for delete to authenticated using(bucket_id='negin-uploads' and exists(select 1 from public.admins a where a.email=(select auth.jwt()->>'email')));
