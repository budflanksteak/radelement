/**
 * Vercel serverless proxy for the NCBO BioPortal API (RadLex ontology search).
 *
 * Mirrors:  /api/bioportal/*  →  https://data.bioontology.org/*
 *
 * Two important jobs:
 *  1. Keeps the BIOPORTAL_KEY server-side so it is never exposed in the
 *     browser bundle or network requests visible to end-users.
 *  2. Strips the Origin and Referer headers that BioPortal rejects when they
 *     contain a non-whitelisted domain (the same issue we fixed in the Vite proxy).
 *
 * Environment variable required (set in Vercel dashboard):
 *   BIOPORTAL_KEY=<your free key from bioportal.bioontology.org>
 *
 * Note: VITE_ prefix is NOT used here because this code runs server-side and
 * does not need Vite to inject the value.
 */

export const config = { runtime: 'edge' };

const UPSTREAM = 'https://data.bioontology.org';

export default async function handler(req) {
  const apiKey = process.env.BIOPORTAL_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'BIOPORTAL_KEY not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(req.url);

  // Strip /api/bioportal prefix
  const upstreamPath = url.pathname.replace(/^\/api\/bioportal/, '') || '/';

  // Forward all original query params, then inject apikey
  const params = new URLSearchParams(url.search);
  params.set('apikey', apiKey);

  const upstreamUrl = `${UPSTREAM}${upstreamPath}?${params.toString()}`;

  // Deliberately omit Origin and Referer — BioPortal rejects unknown origins
  const response = await fetch(upstreamUrl, {
    method: req.method,
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
