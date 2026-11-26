import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const configuredOrigin = import.meta.env.PUBLIC_SITE_URL || site?.origin || 'https://neghinkhodro.com';
  const origin = new URL(configuredOrigin).origin;
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /modiriyat/',
    'Disallow: /_private/',
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
