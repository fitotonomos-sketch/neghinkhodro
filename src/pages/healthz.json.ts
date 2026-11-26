import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = () => new Response(
  JSON.stringify({ status: 'ok', service: 'negin-khodro-static', generated_at: new Date().toISOString() }),
  {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
    },
  },
);
