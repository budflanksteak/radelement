/// <reference types="vite/client" />
/**
 * useOntologySearch
 *
 * Debounced, multi-source ontology term search for the CDE editor.
 * Sources:
 *   1. RadLex  – two strategies depending on environment:
 *        a. BioPortal (preferred) — live search of the full 34k-term RadLex ontology
 *                                   via /api/bioportal proxy (key held server-side in
 *                                   Vercel env var, or in .env for local dev)
 *        b. RadElement fallback   — 178 curated terms from /api/radelement/v1/codes/radlex,
 *                                   fetched once and cached when BioPortal is unavailable
 *   2. SNOMED CT – queried live via the SNOMED International Snowstorm public server
 *                  (proxied: /api/snomed → https://browser.ihtsdotools.org/snowstorm/snomed-ct)
 */

import { useState, useEffect, useRef } from 'react';

export interface OntologyTerm {
  system: 'RADLEX' | 'SNOMEDCT';
  code: string;
  display: string;
  href?: string;
}

// ── Module-level RadLex cache (loaded once per app session) ────────────────

let radlexCache: OntologyTerm[] | null = null;
let radlexPromise: Promise<OntologyTerm[]> | null = null;

async function getRadlexTerms(): Promise<OntologyTerm[]> {
  if (radlexCache !== null) return radlexCache;
  if (radlexPromise) return radlexPromise;

  radlexPromise = (async (): Promise<OntologyTerm[]> => {
    try {
      // Fetch first page to discover total page count
      const res = await fetch('/api/radelement/v1/codes/radlex?per_page=200', {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) { radlexCache = []; return []; }

      const envelope = await res.json();

      // API returns a Laravel-paginated envelope: { data: [...], meta: { last_page } }
      const pageData: Record<string, string>[] = Array.isArray(envelope)
        ? envelope
        : Array.isArray(envelope.data)
          ? envelope.data
          : [];

      const lastPage: number = envelope?.meta?.last_page ?? 1;

      // Fetch remaining pages if the API ignored per_page=200
      let allRaw = [...pageData];
      if (lastPage > 1) {
        const extra = await Promise.all(
          Array.from({ length: lastPage - 1 }, (_, i) =>
            fetch(`/api/radelement/v1/codes/radlex?page=${i + 2}`, {
              headers: { Accept: 'application/json' },
            })
              .then(r => r.ok ? r.json() : null)
              .then(d => (d && Array.isArray(d.data) ? d.data as Record<string, string>[] : []))
              .catch(() => [] as Record<string, string>[]),
          ),
        );
        allRaw = [...allRaw, ...extra.flat()];
      }

      const terms: OntologyTerm[] = allRaw
        .map((item: Record<string, string>) => ({
          system: 'RADLEX' as const,
          code: item.code || item.id || '',
          display: item.display || item.preferred_label || item.name || item.term || '',
          href:
            item.url ||
            item.href ||
            (item.code ? `https://radlex.org/RID/${item.code}` : undefined),
        }))
        .filter(t => t.code && t.display);

      radlexCache = terms;
      return terms;
    } catch {
      radlexCache = []; // prevent retry loops
      return [] as OntologyTerm[];
    }
  })();

  return radlexPromise;
}

// ── BioPortal RadLex search (full 34k-term ontology) ──────────────────────
// The API key is held server-side (Vercel env var BIOPORTAL_KEY in production,
// VITE_BIOPORTAL_KEY in .env for local dev). The proxy returns 503 when the key
// is missing, which we treat as "unavailable" and fall back to the curated list.

async function searchRadlexBioPortal(query: string): Promise<OntologyTerm[]> {
  const params = new URLSearchParams({
    q: query,
    ontologies: 'RADLEX',
    pagesize: '10',
    display_context: 'false',
    display_links: 'false',
  });
  const res = await fetch(`/api/bioportal/search?${params}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const seen = new Set<string>();
  return ((data.collection ?? []) as Record<string, unknown>[])
    .map(item => {
      const notation = (item['@id'] as string ?? '').split('/').pop() ?? '';
      const code = notation.startsWith('RID') ? notation : '';
      const display =
        (item.prefLabel as string) ||
        ((item.synonym as string[]) ?? [])[0] ||
        '';
      return {
        system: 'RADLEX' as const,
        code,
        display,
        href: code ? `https://radlex.org/RID/${code}` : undefined,
      };
    })
    .filter(t => {
      if (!t.code || !t.display || seen.has(t.code)) return false;
      seen.add(t.code);
      return true;
    })
    .slice(0, 5);
}

// ── SNOMED CT via Snowstorm proxy ──────────────────────────────────────────

async function searchSnomed(query: string): Promise<OntologyTerm[]> {
  const params = new URLSearchParams({
    term: query,
    active: 'true',
    conceptActive: 'true',
    limit: '12',
  });

  const res = await fetch(`/api/snomed/descriptions?${params}`, {
    headers: { 'Accept-Language': 'en-US,en' },
  });

  if (!res.ok) return [];
  const data = await res.json();

  const seen = new Set<string>();
  return (data.items ?? [])
    .filter((item: Record<string, unknown>) => {
      const concept = item.concept as Record<string, unknown> | undefined;
      return item.active && concept?.active;
    })
    .map((item: Record<string, unknown>) => {
      const concept = item.concept as Record<string, string> | undefined;
      const conceptId = concept?.conceptId ?? '';
      return {
        system: 'SNOMEDCT' as const,
        code: conceptId,
        display: (item.term as string) ?? '',
        href: conceptId
          ? `https://browser.ihtsdotools.org/?perspective=full&conceptId1=${conceptId}`
          : undefined,
      };
    })
    .filter((t: OntologyTerm) => {
      if (!t.code || seen.has(t.code)) return false;
      seen.add(t.code);
      return true;
    })
    .slice(0, 7);
}

// ── Scoring ────────────────────────────────────────────────────────────────

function scoreMatch(display: string, query: string): number {
  const d = display.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  if (d === q) return 100;
  if (d.startsWith(q + ' ') || d.startsWith(q)) return 85;
  if (d.includes(' ' + q) || d.includes(q)) return 55;

  const queryWords = q.split(/\s+/).filter(w => w.length > 2);
  const displayWords = d.split(/\s+/).filter(w => w.length > 2);

  // Reverse check: if every display word appears somewhere in the query, strong match
  if (displayWords.length > 0 && displayWords.every(w => q.includes(w))) return 65;

  // Forward check: how many query words appear in the display
  if (queryWords.length > 1) {
    const hits = queryWords.filter(w => d.includes(w)).length;
    if (hits === 0) return 0;
    const ratio = hits / queryWords.length;
    // Partial forward match — require at least half the query words to match
    return ratio >= 0.5 ? ratio * 40 : 0;
  }
  return 0;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export interface UseOntologySearchResult {
  results: OntologyTerm[];
  loading: boolean;
}

export function useOntologySearch(
  query: string,
  enabled = true,
): UseOntologySearchResult {
  const [results, setResults] = useState<OntologyTerm[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!enabled || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    clearTimeout(timerRef.current);
    setLoading(true);

    timerRef.current = setTimeout(async () => {
      try {
        // Always try BioPortal first (key is held server-side by the proxy).
        // If the proxy returns nothing (key not configured / network error),
        // fall back to the 178 curated terms from the RadElement API.
        const [bioportalSettled, snomedSettled] = await Promise.allSettled([
          searchRadlexBioPortal(query),
          searchSnomed(query),
        ]);

        const bioportalRaw =
          bioportalSettled.status === 'fulfilled' ? bioportalSettled.value : [];
        const snomedAll =
          snomedSettled.status === 'fulfilled' ? snomedSettled.value : [];

        // BioPortal pre-ranks by relevance. If it returned nothing, score the
        // curated RadElement list instead.
        let radlexFinal: OntologyTerm[];
        if (bioportalRaw.length > 0) {
          radlexFinal = bioportalRaw;
        } else {
          const curated = await getRadlexTerms();
          radlexFinal = curated
            .map(t => ({ t, score: scoreMatch(t.display, query) }))
            .filter(r => r.score >= 25)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(r => r.t);
        }

        const radlexRaw = radlexFinal; // kept for clarity below

        setResults([...radlexRaw, ...snomedAll]);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timerRef.current);
  }, [query, enabled]);

  return { results, loading };
}
