/**
 * Vercel serverless proxy for the RSNA RadElement API.
 *
 * Mirrors:  /api/radelement/v1/*  →  https://api3.rsna.org/radelement/v1/*
 *
 * Catches requests that the browser cannot make directly due to CORS restrictions
 * on the RSNA origin.
 */

export const config = { runtime: 'edge' };

const UPSTREAM = 'https://api3.rsna.org/radelement';

export default async function handler(req) {
  const url = new URL(req.url);

  // Strip the /api/radelement prefix to get the upstream path
  const upstreamPath = url.pathname.replace(/^\/api\/radelement/, '');
  const upstreamUrl = `${UPSTREAM}${upstreamPath}${url.search}`;

  const upstreamReq = new Request(upstreamUrl, {
    method: req.method,
    headers: {
      Accept: req.headers.get('Accept') || 'application/json',
      'Content-Type': req.headers.get('Content-Type') || 'application/json',
    },
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
  });

  const response = await fetch(upstreamReq);

  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Accept, Content-Type');

  return new Response(response.body, {
    status: response.status,
    headers,
  });
}
