import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = ({ site }) => {
  const configuredOrigin = import.meta.env.PUBLIC_SITE_URL || site?.origin || 'https://neghinkhodro.onrender.com';
  let origin = 'https://neghinkhodro.onrender.com';
  try { origin = new URL(configuredOrigin).origin; }
  catch { console.error('[Negin Khodro] Invalid PUBLIC_SITE_URL in robots configuration.'); }
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /modiriyat/',
    'Disallow: /api/',
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
