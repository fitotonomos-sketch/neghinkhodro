-- Replace the unavailable generated hero URL in site settings with the refreshed banner.
-- Affected table: public.settings.assets.banner.
update public.settings
set value = jsonb_set(value, '{banner}', '"https://cdn.b12.io/client_media/c93YGkzI/aa73ecc4-e3d2-11f1-b5aa-0242ac110002-realistic-premium-automotive-showroom-banner-photograph-for-.jpg"'::jsonb, true)
where key='assets' and value->>'banner' like '%45fe9503-e3a2%';
