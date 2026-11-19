-- Replace the unavailable generated hero URL in site settings with the refreshed banner.
-- Affected table: public.settings.assets.banner.
update public.settings
set value = jsonb_set(value, '{banner}', '"/images/showroom-banner.jpg"'::jsonb, true)
where key='assets' and value->>'banner' like '%45fe9503-e3a2%';
