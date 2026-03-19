/**
 * OntologySuggest
 *
 * A floating dropdown that appears below any input when the author types,
 * showing matching RadLex and SNOMED CT terms. Clicking a term inserts its
 * ontology code into the current element or set's index_codes.
 *
 * Usage:
 *   <div className="relative">
 *     <Input value={...} onChange={...} onFocus={...} onBlur={...} />
 *     <OntologySuggest
 *       query={query}
 *       visible={isFocused && query.length >= 2}
 *       onSelect={term => addIndexCode(term)}
 *       onClose={() => setVisible(false)}
 *     />
 *   </div>
 */

import { useEffect, useRef } from 'react';
import { BookOpen, ExternalLink, Loader2 } from 'lucide-react';
import { useOntologySearch, OntologyTerm } from '../../hooks/useOntologySearch';
import { clsx } from 'clsx';

const SYSTEM_CONFIG = {
  RADLEX: {
    label: 'RadLex',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  },
  SNOMEDCT: {
    label: 'SNOMED CT',
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  },
} as const;

interface OntologySuggestProps {
  query: string;
  visible: boolean;
  onSelect: (term: OntologyTerm) => void;
  onClose: () => void;
  className?: string;
}

export function OntologySuggest({
  query,
  visible,
  onSelect,
  onClose,
  className,
}: OntologySuggestProps) {
  const { results, loading } = useOntologySearch(query, visible && query.length >= 2);
  const ref = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [visible, onClose]);

  if (!visible || query.trim().length < 2) return null;

  const radlex = results.filter(r => r.system === 'RADLEX');
  const snomed = results.filter(r => r.system === 'SNOMEDCT');
  const hasResults = radlex.length > 0 || snomed.length > 0;

  return (
    <div
      ref={ref}
      className={clsx(
        'absolute left-0 right-0 z-50 mt-1 rounded-xl border border-slate-200 bg-white shadow-xl',
        'dark:border-slate-600 dark:bg-slate-800',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-700/50 rounded-t-xl">
        <BookOpen size={12} className="text-slate-400" />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Ontology suggestions — click to add code
        </span>
        {loading && <Loader2 size={11} className="ml-auto animate-spin text-slate-400" />}
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); onClose(); }}
          className="ml-auto text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          ✕
        </button>
      </div>

      {/* Results */}
      <div className="max-h-60 overflow-y-auto">
        {loading && !hasResults && (
          <div className="flex items-center gap-2 px-3 py-3 text-xs text-slate-400">
            <Loader2 size={12} className="animate-spin" />
            Searching RadLex and SNOMED CT…
          </div>
        )}
        {!loading && !hasResults && (
          <div className="px-3 py-3 text-xs text-slate-400 italic">
            No ontology matches found for "{query}"
          </div>
        )}
        {radlex.length > 0 && (
          <TermGroup label="RadLex" terms={radlex} onSelect={onSelect} />
        )}
        {snomed.length > 0 && (
          <TermGroup label="SNOMED CT" terms={snomed} onSelect={onSelect} />
        )}
      </div>

      {/* Footer hint */}
      {hasResults && (
        <div className="rounded-b-xl border-t border-slate-100 bg-slate-50 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-700/30">
          <p className="text-xs text-slate-400">
            Selecting a term adds its ontology code to this element's index codes
          </p>
        </div>
      )}
    </div>
  );
}

function TermGroup({
  label,
  terms,
  onSelect,
}: {
  label: string;
  terms: OntologyTerm[];
  onSelect: (term: OntologyTerm) => void;
}) {
  return (
    <div>
      <div className="bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:bg-slate-700/30 dark:text-slate-500">
        {label}
      </div>
      {terms.map(term => (
        <TermRow key={`${term.system}-${term.code}`} term={term} onSelect={onSelect} />
      ))}
    </div>
  );
}

function TermRow({
  term,
  onSelect,
}: {
  term: OntologyTerm;
  onSelect: (term: OntologyTerm) => void;
}) {
  const cfg = SYSTEM_CONFIG[term.system];

  return (
    <button
      type="button"
      onMouseDown={e => {
        e.preventDefault(); // Don't blur the parent input
        onSelect(term);
      }}
      className="group flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-brand-50 dark:hover:bg-brand-900/20"
    >
      <span
        className={clsx(
          'shrink-0 rounded px-1.5 py-0.5 font-mono text-xs font-semibold',
          cfg.badge,
        )}
      >
        {term.code}
      </span>
      <span className="flex-1 truncate text-sm text-slate-800 dark:text-slate-200">
        {term.display}
      </span>
      {term.href && (
        <a
          href={term.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          title="Open in ontology browser"
          className="shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-brand-500"
        >
          <ExternalLink size={11} />
        </a>
      )}
    </button>
  );
}
