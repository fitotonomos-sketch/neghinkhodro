-- Point the admin's current banner preview at the working generated showroom hero.
-- Affected table: public.settings.assets.
update public.settings
set value = jsonb_set(value, '{banner}', '"https://cdn.b12.io/client_media/c93YGkzI/45fe9503-e3a2-11f1-bfc0-0242ac110002-premium-editorial-automotive-showroom-hero-photograph-for-a-.jpg"'::jsonb, true)
where key='assets' and coalesce(value->>'banner','')='';
