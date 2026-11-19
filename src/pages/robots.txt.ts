import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const origin = (import.meta.env.PUBLIC_SITE_URL || site?.origin || 'https://neghinkhodro.onrender.com').replace(/\/$/, '');
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /modiriyat/',
    'Disallow: /auth/',
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
