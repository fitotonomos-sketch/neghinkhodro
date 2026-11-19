-- Point the admin's current banner preview at the working generated showroom hero.
-- Affected table: public.settings.assets.
update public.settings
set value = jsonb_set(value, '{banner}', '"/images/showroom-banner.jpg"'::jsonb, true)
where key='assets' and coalesce(value->>'banner','')='';
