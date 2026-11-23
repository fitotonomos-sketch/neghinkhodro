import type { APIRoute } from 'astro';
import { getPublicVehicles } from '../lib/public-vehicles';

export const prerender = false;

const xmlEscape = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

export const GET: APIRoute = async ({ site }) => {
  const configuredOrigin = import.meta.env.PUBLIC_SITE_URL || site?.origin || 'https://neghinkhodro.onrender.com';
  let origin = 'https://neghinkhodro.onrender.com';
  try { origin = new URL(configuredOrigin).origin; }
  catch { console.error('[Negin Khodro] Invalid PUBLIC_SITE_URL in sitemap configuration.'); }
  const staticPaths = ['/', '/vehicles/', '/about/', '/guide/', '/contact/', '/privacy/', '/terms/'];

  let vehicles: Awaited<ReturnType<typeof getPublicVehicles>> = [];
  try {
    vehicles = await getPublicVehicles();
  } catch (error) {
    console.error('[Negin Khodro] Sitemap inventory query failed:', error);
  }

  const urls = new Set([
    ...staticPaths.map((path) => `${origin}${path}`),
    ...vehicles.filter((vehicle) => vehicle.slug)
      .map((vehicle) => `${origin}/vehicle/${encodeURIComponent(vehicle.slug)}/`),
  ]);

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    [...urls].map((url) => `<url><loc>${xmlEscape(url)}</loc></url>`).join('') +
    `</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
    },
  });
};
