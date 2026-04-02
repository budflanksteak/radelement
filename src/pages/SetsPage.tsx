import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X, ChevronLeft, ChevronRight, SlidersHorizontal, LayoutGrid, List } from 'lucide-react';
import { fetchSets } from '../api/radelement';
import { CDESetSummary, getStatusName } from '../types/cde';
import { SetCard } from '../components/cde/SetCard';
import { SPECIALTIES, MODALITIES } from '../data/mockData';

const PAGE_SIZE = 12;

export function SetsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allSets, setAllSets] = useState<CDESetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const q = searchParams.get('q') || '';
  const statusFilter = searchParams.get('status') || '';
  const specialtyFilter = searchParams.get('specialty') || '';
  const modalityFilter = searchParams.get('modality') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchSets({ limit: 300 })
      .then(data => setAllSets(data as CDESetSummary[]))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return allSets.filter(s => {
      const name = getStatusName(s.status as any);
      if (statusFilter && name !== statusFilter) return false;
      if (q) {
        const lq = q.toLowerCase();
        const matchName = s.name?.toLowerCase().includes(lq);
        const matchDesc = s.description?.toLowerCase().includes(lq);
        const matchId = s.id?.toLowerCase().includes(lq);
        if (!matchName && !matchDesc && !matchId) return false;
      }
      if (specialtyFilter) {
        if (!s.specialties?.some(sp => sp.code === specialtyFilter)) return false;
      }
      if (modalityFilter) {
        const mods = (s.modality || '').split(',').map(m => m.trim());
        if (!mods.includes(modalityFilter)) return false;
      }
      return true;
    });
  }, [allSets, q, statusFilter, specialtyFilter, modalityFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function setParam(key: string, value: string) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== 'page') next.delete('page');
      return next;
    });
  }

  function goToPage(newPage: number) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (newPage > 1) next.set('page', String(newPage));
      else next.delete('page');
      return next;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function clearFilters() {
    setSearchParams({});
  }

  const hasFilters = q || statusFilter || specialtyFilter || modalityFilter;
  const [view, setView] = useState<'card' | 'list'>('card');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">CDE Sets</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {loading ? 'Loading…' : `${filtered.length.toLocaleString()} sets`}
            {!loading && allSets.length !== filtered.length && ` of ${allSets.length.toLocaleString()} total`}
          </p>
        </div>
        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <button
            onClick={() => setView('card')}
            title="Card view"
            className={`p-1.5 transition-colors ${view === 'card' ? 'bg-brand-600 text-white' : 'bg-white text-slate-400 hover:text-slate-600 dark:bg-slate-800 dark:hover:text-slate-200'}`}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setView('list')}
            title="List view"
            className={`p-1.5 transition-colors ${view === 'list' ? 'bg-brand-600 text-white' : 'bg-white text-slate-400 hover:text-slate-600 dark:bg-slate-800 dark:hover:text-slate-200'}`}
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={e => setParam('q', e.target.value)}
            placeholder="Search sets by name, description, or ID…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
          />
          {q && (
            <button onClick={() => setParam('q', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>

        <button
          onClick={() => setFilterOpen(v => !v)}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors
            ${filterOpen || hasFilters
              ? 'border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-600 dark:bg-brand-900/30 dark:text-brand-300'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
            }`}
        >
          <SlidersHorizontal size={16} />
          Filters
          {hasFilters && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-white text-xs">
              {[q, statusFilter, specialtyFilter, modalityFilter].filter(Boolean).length}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {filterOpen && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Filter size={14} /> Filters
            </h3>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400">
                Clear all
              </button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Status */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</label>
              <div className="mt-2 flex flex-col gap-1.5">
                {['Published', 'Proposed', 'Retired'].map(s => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value={s}
                      checked={statusFilter === s}
                      onChange={() => setParam('status', statusFilter === s ? '' : s)}
                      className="accent-brand-600"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{s}</span>
                  </label>
                ))}
                {statusFilter && (
                  <button onClick={() => setParam('status', '')} className="text-xs text-slate-400 hover:text-slate-600 text-left">
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Specialty */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Specialty</label>
              <select
                value={specialtyFilter}
                onChange={e => setParam('specialty', e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:border-brand-400"
              >
                <option value="">All specialties</option>
                {SPECIALTIES.map(sp => (
                  <option key={sp.abbreviation} value={sp.abbreviation}>{sp.name}</option>
                ))}
              </select>
            </div>

            {/* Modality */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Modality</label>
              <select
                value={modalityFilter}
                onChange={e => setParam('modality', e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:border-brand-400"
              >
                <option value="">All modalities</option>
                {MODALITIES.map(m => (
                  <option key={m.code} value={m.code}>{m.code} – {m.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Active filters */}
      {hasFilters && !filterOpen && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">Filtered by:</span>
          {q && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
              "{q}"
              <button onClick={() => setParam('q', '')}><X size={12} /></button>
            </span>
          )}
          {statusFilter && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
              {statusFilter}
              <button onClick={() => setParam('status', '')}><X size={12} /></button>
            </span>
          )}
          {specialtyFilter && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
              {SPECIALTIES.find(s => s.abbreviation === specialtyFilter)?.name || specialtyFilter}
              <button onClick={() => setParam('specialty', '')}><X size={12} /></button>
            </span>
          )}
          {modalityFilter && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
              {modalityFilter}
              <button onClick={() => setParam('modality', '')}><X size={12} /></button>
            </span>
          )}
          <button onClick={clearFilters} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">Clear all</button>
        </div>
      )}

      {/* Results */}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-600 dark:text-red-400">Failed to load CDE sets: {error}</p>
        </div>
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="h-44 rounded-xl border border-slate-200 bg-slate-100 animate-pulse dark:border-slate-700 dark:bg-slate-800" />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-800">
          <p className="text-slate-500 dark:text-slate-400">No CDE sets match your filters.</p>
          <button onClick={clearFilters} className="mt-3 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400">
            Clear filters
          </button>
        </div>
      ) : view === 'card' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginated.map(set => (
            <SetCard key={set.id} set={set} view="card" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {paginated.map(set => (
            <SetCard key={set.id} set={set} view="list" />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronLeft size={16} /> Prev
          </button>

          {/* Page number buttons — show up to 7 around current page */}
          {(() => {
            const pages: (number | '…')[] = [];
            const delta = 2;
            for (let i = 1; i <= totalPages; i++) {
              if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
                pages.push(i);
              } else if (pages[pages.length - 1] !== '…') {
                pages.push('…');
              }
            }
            return pages.map((p, i) =>
              p === '…' ? (
                <span key={`ellipsis-${i}`} className="px-1 text-slate-400 select-none">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => goToPage(p as number)}
                  className={`min-w-[2rem] rounded-lg border px-2 py-1.5 text-sm transition-colors ${
                    p === page
                      ? 'border-brand-400 bg-brand-50 font-semibold text-brand-700 dark:border-brand-600 dark:bg-brand-900/30 dark:text-brand-300'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  {p}
                </button>
              )
            );
          })()}

          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
