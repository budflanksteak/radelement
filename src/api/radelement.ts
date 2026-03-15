// RadElement API client
// Real API: https://api3.rsna.org/radelement/v1
//
// In development:  Vite proxy handles /api/radelement/v1/* → api3.rsna.org
// In production:   Vercel Edge Function at /api/radelement/[...path].js handles it
const BASE_URL = '/api/radelement/v1';

export interface ListParams {
  limit?: number;
  offset?: number;
  status?: string;
  name?: string;
  specialty?: string;
  modality?: string;
}

async function apiFetch<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
    });
  }
  const res = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json' }
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
  return res.json();
}

// ── Sets ───────────────────────────────────────────────────────────────────

export async function fetchSets(params: ListParams = {}) {
  const { limit = 100, offset = 0, ...rest } = params;
  const p: Record<string, string | number> = { limit, offset };
  Object.entries(rest).forEach(([k, v]) => { if (v) p[k] = v; });
  return apiFetch<unknown[]>('/sets', p);
}

export async function fetchSetById(id: string) {
  return apiFetch<unknown>(`/sets/${id}`);
}

// ── Elements ───────────────────────────────────────────────────────────────

export async function fetchElements(params: ListParams = {}) {
  const { limit = 200, offset = 0, ...rest } = params;
  const p: Record<string, string | number> = { limit, offset };
  Object.entries(rest).forEach(([k, v]) => { if (v) p[k] = v; });
  return apiFetch<unknown[]>('/elements', p);
}

export async function fetchElementById(id: string) {
  return apiFetch<unknown>(`/elements/${id}`);
}

// ── Codes ──────────────────────────────────────────────────────────────────

export async function fetchCodes() {
  return apiFetch<unknown[]>('/codes');
}

export async function fetchCodesBySystem(system: string) {
  return apiFetch<unknown[]>(`/codes/${system}`);
}
