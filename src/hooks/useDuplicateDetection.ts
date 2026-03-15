/**
 * useDuplicateDetection
 *
 * As an author types a CDE set or element name, this hook searches the live
 * RadElement repository for similar existing sets/elements and surfaces them
 * so the author can consider forking rather than creating a duplicate.
 *
 * - All sets are fetched once and cached in module scope (shared across instances)
 * - Matching is done client-side with word-overlap scoring
 * - Results update with a 500 ms debounce to avoid excessive API calls
 */

import { useState, useEffect, useRef } from 'react';
import { fetchSets, fetchElements } from '../api/radelement';
import { CDESetSummary } from '../types/cde';

// ── Module-level caches ────────────────────────────────────────────────────

let setsCache: CDESetSummary[] | null = null;
let setsPromise: Promise<CDESetSummary[]> | null = null;

async function getAllSets(): Promise<CDESetSummary[]> {
  if (setsCache !== null) return setsCache;
  if (setsPromise) return setsPromise;

  setsPromise = fetchSets({ limit: 300 })
    .then(data => {
      setsCache = data as CDESetSummary[];
      return setsCache;
    })
    .catch(() => {
      setsCache = [];
      return [] as CDESetSummary[];
    });

  return setsPromise;
}

interface ElementSummary {
  id: string;
  name: string;
  parent_set?: string;
  definition?: string;
}

let elementsCache: ElementSummary[] | null = null;
let elementsPromise: Promise<ElementSummary[]> | null = null;

async function getAllElements(): Promise<ElementSummary[]> {
  if (elementsCache !== null) return elementsCache;
  if (elementsPromise) return elementsPromise;

  elementsPromise = fetchElements({ limit: 400 })
    .then(data => {
      elementsCache = (data as Record<string, string>[]).map(e => ({
        id: e.id ?? '',
        name: e.name ?? '',
        parent_set: e.set_id ?? e.parent_set ?? '',
        definition: e.definition ?? '',
      }));
      return elementsCache;
    })
    .catch(() => {
      elementsCache = [];
      return [] as ElementSummary[];
    });

  return elementsPromise;
}

// ── Similarity scoring ─────────────────────────────────────────────────────

/** Returns a 0–1 score based on word overlap between two strings. */
function wordSimilarity(a: string, b: string): number {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2);

  const aWords = new Set(normalize(a));
  const bWords = normalize(b);

  if (!aWords.size || !bWords.length) return 0;

  const matches = bWords.filter(w => aWords.has(w)).length;
  const score = matches / Math.max(aWords.size, bWords.length);

  // Bonus for exact prefix / substring match
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  if (al === bl) return 1;
  if (al.startsWith(bl) || bl.startsWith(al)) return Math.max(score, 0.75);

  return score;
}

// ── Public types ──────────────────────────────────────────────────────────

export interface SimilarSet {
  set: CDESetSummary;
  score: number;
}

export interface SimilarElement {
  id: string;
  name: string;
  parentSet?: string;
  definition?: string;
  score: number;
}

export interface DuplicateDetectionResult {
  similarSets: SimilarSet[];
  similarElements: SimilarElement[];
  loading: boolean;
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useDuplicateDetection(
  query: string,
  type: 'set' | 'element',
  enabled = true,
): DuplicateDetectionResult {
  const [similarSets, setSimilarSets] = useState<SimilarSet[]>([]);
  const [similarElements, setSimilarElements] = useState<SimilarElement[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!enabled || query.trim().length < 3) {
      setSimilarSets([]);
      setSimilarElements([]);
      setLoading(false);
      return;
    }

    clearTimeout(timerRef.current);
    setLoading(true);

    timerRef.current = setTimeout(async () => {
      try {
        const q = query.trim();

        if (type === 'set') {
          const allSets = await getAllSets();
          const scored = allSets
            .map(set => ({ set, score: wordSimilarity(q, set.name ?? '') }))
            .filter(r => r.score >= 0.3)
            .sort((a, b) => b.score - a.score)
            .slice(0, 4);
          setSimilarSets(scored);
          setSimilarElements([]);
        } else {
          const allElements = await getAllElements();
          const scored = allElements
            .map(el => ({ el, score: wordSimilarity(q, el.name ?? '') }))
            .filter(r => r.score >= 0.35)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map(({ el, score }) => ({
              id: el.id,
              name: el.name,
              parentSet: el.parent_set,
              definition: el.definition,
              score,
            }));
          setSimilarElements(scored);
          setSimilarSets([]);
        }
      } catch {
        setSimilarSets([]);
        setSimilarElements([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timerRef.current);
  }, [query, type, enabled]);

  return { similarSets, similarElements, loading };
}
