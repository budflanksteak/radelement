import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, X, ChevronLeft, ChevronRight, SlidersHorizontal, Hash, ToggleLeft, Ruler } from 'lucide-react';
import { fetchElements } from '../api/radelement';
import { CDEElementSummary } from '../types/cde';
import { clsx } from 'clsx';

const PAGE_SIZE = 24;

const TYPE_STYLES: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  valueSet: { label: 'Value Set', icon: <ToggleLeft size={14} />, color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
  integer: { label: 'Integer', icon: <Hash size={14} />, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  float: { label: 'Float', icon: <Ruler size={14} />, color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
};

export function ElementsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [allElements, setAllElements] = useState<CDEElementSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const q = searchParams.get('q') || '';
  const typeFilter = searchParams.get('type') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  useEffect(() => {
    setLoading(true);
    fetchElements({ limit: 2000 })
      .then(data => setAllElements(data as CDEElementSummary[]))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return allElements.filter(el => {
      if (typeFilter && el.valueType !== typeFilter) return false;
      if (q) {
        const lq = q.toLowerCase();
        if (!el.id?.toLowerCase().includes(lq) &&
            !el.name?.toLowerCase().includes(lq) &&
            !el.shortName?.toLowerCase().includes(lq) &&
            !el.definition?.toLowerCase().includes(lq)) return false;
      }
      return true;
    });
  }, [allElements, q, typeFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  }

  const hasFilters = q || typeFilter;

  // Type counts
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allElements.forEach(el => {
      const t = el.valueType || 'valueSet';
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }, [allElements]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Elements</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {loading ? 'Loading…' : `${filtered.length.toLocaleString()} elements`}
          {!loading && allElements.length !== filtered.length && ` of ${allElements.length.toLocaleString()} total`}
        </p>
      </div>

      {/* Type overview chips */}
      {!loading && (
        <div className="flex flex-wrap gap-3">
          {Object.entries(TYPE_STYLES).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setParam('type', typeFilter === key ? '' : key)}
              className={clsx(
                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all border',
                typeFilter === key
                  ? `${cfg.color} border-current`
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
              )}
            >
              {cfg.icon}
              {cfg.label}
              <span className="rounded-full bg-black/10 px-1.5 py-0.5 text-xs font-semibold dark:bg-white/10">
                {(typeCounts[key] || 0).toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={e => setParam('q', e.target.value)}
            placeholder="Search elements by name, ID, or definition…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
          />
          {q && (
            <button onClick={() => setParam('q', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400">Failed to load elements: {error}</p>
        </div>
      ) : loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl border border-slate-200 bg-slate-100 animate-pulse dark:border-slate-700 dark:bg-slate-800" />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-800">
          <p className="text-slate-500 dark:text-slate-400">No elements match your search.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 hidden md:table-cell">Definition</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:table-cell">Unit</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((el, i) => {
                const type = el.valueType || 'valueSet';
                const cfg = TYPE_STYLES[type] || TYPE_STYLES.valueSet;
                return (
                  <tr
                    key={el.id}
                    onClick={() => navigate(`/elements/${el.id}`)}
                    className={clsx(
                      'cursor-pointer border-b border-slate-100 dark:border-slate-700/50 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-colors',
                      i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-700/10'
                    )}
                  >
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">{el.id}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-slate-900 dark:text-white">{el.name || el.shortName || el.id}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', cfg.color)}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell">
                      <span className="text-slate-500 dark:text-slate-400 line-clamp-1 text-xs max-w-xs">{el.definition}</span>
                    </td>
                    <td className="px-4 py-2.5 hidden sm:table-cell">
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{el.unit || '—'}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setParam('page', String(page - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setParam('page', String(page + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
