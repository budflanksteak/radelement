/**
 * Vercel serverless proxy for the SNOMED CT Snowstorm public server.
 *
 * Mirrors:  /api/snomed/*  →  https://browser.ihtsdotools.org/snowstorm/snomed-ct/*
 *
 * The SNOMED Snowstorm server is public (no API key required) but proxying
 * here avoids any origin-based CORS issues and keeps the URL scheme consistent.
 */

export const config = { runtime: 'edge' };

const UPSTREAM = 'https://browser.ihtsdotools.org/snowstorm/snomed-ct';

export default async function handler(req) {
  const url = new URL(req.url);

  const upstreamPath = url.pathname.replace(/^\/api\/snomed/, '');
  const upstreamUrl = `${UPSTREAM}${upstreamPath}${url.search}`;

  const response = await fetch(upstreamUrl, {
    method: req.method,
    headers: {
      Accept: req.headers.get('Accept') || 'application/json',
      'Accept-Language': req.headers.get('Accept-Language') || 'en-US,en',
    },
  });

  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Accept, Accept-Language');

  return new Response(response.body, {
    status: response.status,
    headers,
  });
}
