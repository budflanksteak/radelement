/**
 * Vercel Edge Function — BioPortal RadLex search proxy.
 *
 * Route:  GET /api/bioportal/search?q=...&ontologies=RADLEX&pagesize=10
 * Upstream: https://data.bioontology.org/search
 *
 * Injects the BIOPORTAL_KEY server-side so it is never exposed in the browser.
 * Environment variable required (set in Vercel dashboard): BIOPORTAL_KEY
 */

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const apiKey = process.env.BIOPORTAL_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'BIOPORTAL_KEY not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(req.url);
  const params = new URLSearchParams(url.search);
  params.set('apikey', apiKey);

  const upstreamUrl = `https://data.bioontology.org/search?${params.toString()}`;

  const response = await fetch(upstreamUrl, {
    method: 'GET',
    headers: {
      Accept: req.headers.get('Accept') || 'application/json',
    },
  });

  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Accept');

  return new Response(response.body, {
    status: response.status,
    headers,
  });
}
