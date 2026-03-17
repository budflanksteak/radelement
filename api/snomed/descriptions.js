/**
 * Vercel Edge Function — SNOMED CT description search proxy.
 *
 * Route:  GET /api/snomed/descriptions?term=...&active=true&limit=12
 * Upstream: https://browser.ihtsdotools.org/snowstorm/snomed-ct/browser/MAIN/descriptions
 *
 * The direct Vercel rewrite to ihtsdotools.org returns 502 ROUTER_EXTERNAL_TARGET_CONNECTION_ERROR.
 * An Edge Function resolves this by fetching from within Vercel's compute layer.
 */

export const config = { runtime: 'edge' };

const UPSTREAM = 'https://browser.ihtsdotools.org/snowstorm/snomed-ct/browser/MAIN/descriptions';

export default async function handler(req) {
  const url = new URL(req.url);
  const upstreamUrl = `${UPSTREAM}?${url.searchParams.toString()}`;

  try {
    const response = await fetch(upstreamUrl, {
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en',
      },
    });

    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'SNOMED proxy error', items: [] }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
