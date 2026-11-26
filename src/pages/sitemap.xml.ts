import type { APIRoute } from 'astro';
import { getPublicVehicles } from '../lib/public-vehicles';

// This static copy is a safe fallback. Apache serves the live sitemap.php
// endpoint on compatible shared hosting so new vehicle slugs are included automatically.
export const prerender = true;

const xmlEscape = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

export const GET: APIRoute = async ({ site }) => {
  const configuredOrigin = import.meta.env.PUBLIC_SITE_URL || site?.origin || 'https://neghinkhodro.com';
  const origin = new URL(configuredOrigin).origin;
  let vehicles: Awaited<ReturnType<typeof getPublicVehicles>> = [];

  try {
    vehicles = await getPublicVehicles();
  } catch (error) {
    console.error('[Negin Khodro] Static sitemap inventory query failed:', error);
  }

  const staticPaths = ['/', '/vehicles/', '/about/', '/guide/', '/contact/', '/privacy/', '/terms/'];
  const urls = new Set([
    ...staticPaths.map((path) => `${origin}${path}`),
    ...vehicles.filter((vehicle) => vehicle.slug)
      .map((vehicle) => `${origin}/vehicle/${encodeURIComponent(vehicle.slug)}/`),
  ]);
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...urls].map((url) => `<url><loc>${xmlEscape(url)}</loc></url>`).join('')}</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
    },
  });
};
