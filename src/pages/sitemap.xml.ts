import type { APIRoute } from 'astro';
import { getPublicVehicles } from '../lib/public-vehicles';

const xmlEscape = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

export const GET: APIRoute = async ({ site }) => {
  const origin = (import.meta.env.PUBLIC_SITE_URL || site?.origin || 'https://neghinkhodro.onrender.com').replace(/\/$/, '');
  const staticPaths = ['/', '/vehicles/', '/about/', '/guide/', '/contact/', '/privacy/', '/terms/'];
  const vehicles = await getPublicVehicles();
  const urls = [
    ...staticPaths.map((path) => `${origin}${path}`),
    ...vehicles.map((vehicle) => `${origin}/vehicle/${encodeURIComponent(vehicle.slug)}/`),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    urls.map((url) => `<url><loc>${xmlEscape(url)}</loc></url>`).join('') +
    `</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800',
    },
  });
};
