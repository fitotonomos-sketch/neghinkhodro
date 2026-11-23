import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = () => new Response(
  JSON.stringify({ status: 'ok', service: 'negin-khodro', timestamp: new Date().toISOString() }),
  {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  },
);
