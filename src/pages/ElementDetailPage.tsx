import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Hash, ToggleLeft, Ruler, ExternalLink, Database } from 'lucide-react';
import { fetchElementById } from '../api/radelement';
import { CDEElement, getElementType } from '../types/cde';
import { StatusBadge } from '../components/cde/StatusBadge';
import { Button } from '../components/ui/Button';
import { useDraftsStore } from '../store/draftsStore';
import { clsx } from 'clsx';

const TYPE_CONFIG = {
  value_set: { icon: <ToggleLeft size={20} />, label: 'Value Set', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
  integer: { icon: <Hash size={20} />, label: 'Integer', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  float: { icon: <Ruler size={20} />, label: 'Float', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
};

export function ElementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [element, setElement] = useState<CDEElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { drafts } = useDraftsStore();

  useEffect(() => {
    if (!id) return;
    // Draft element IDs contain TO_BE_DETERMINED — search local drafts store
    if (id.includes('TO_BE_DETERMINED')) {
      let found: CDEElement | undefined;
      for (const draft of drafts) {
        found = draft.set.elements.find(el => el.id === id);
        if (found) break;
      }
      setElement(found ?? null);
      if (!found) setError('Element not found in local drafts');
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchElementById(id)
      .then(data => setElement(data as CDEElement))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, drafts]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 rounded-lg bg-slate-200 animate-pulse dark:bg-slate-700" />
        <div className="h-48 rounded-xl bg-slate-200 animate-pulse dark:bg-slate-700" />
      </div>
    );
  }

  if (error || !element) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
        <p className="text-red-600 dark:text-red-400">{error || 'Element not found'}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/elements')}>
          <ArrowLeft size={14} /> Back to Elements
        </Button>
      </div>
    );
  }

  const type = getElementType(element);
  const cfg = TYPE_CONFIG[type];
  const status = element.status;
  const statusName = typeof status === 'object' && status && 'name' in status ? status.name : (status as string || 'Proposed');

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-start gap-4">
          <div className={clsx('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', cfg.color)}>
            {cfg.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-sm font-semibold text-slate-400 dark:text-slate-500">{element.id}</span>
              <span className={clsx('rounded-full px-2.5 py-0.5 text-xs font-medium', cfg.color)}>{cfg.label}</span>
              <StatusBadge status={statusName as any} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{element.name}</h1>
            {element.parent_set && (
              <Link to={`/sets/${element.parent_set}`} className="mt-1 inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400">
                <Database size={13} /> {element.parent_set}
              </Link>
            )}
          </div>
        </div>

        {element.definition && (
          <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Definition</p>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{element.definition}</p>
          </div>
        )}

        {element.question && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Question</p>
            <p className="text-slate-700 dark:text-slate-300 italic">"{element.question}"</p>
          </div>
        )}
      </div>

      {/* Value Set */}
      {element.value_set && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Allowed Values</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Cardinality: min {element.value_set.min_cardinality}, max {element.value_set.max_cardinality}
            {element.value_set.max_cardinality > 1 ? ' (multi-select)' : ' (single select)'}
          </p>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Code</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Value</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Display Name</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 hidden md:table-cell">Definition</th>
                </tr>
              </thead>
              <tbody>
                {element.value_set.values.map((v, i) => (
                  <tr key={i} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-400">{v.code || '—'}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-600 dark:text-slate-400">{v.value}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">{v.name}</td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs hidden md:table-cell">{v.definition || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Numeric value */}
      {(element.integer_value || element.float_value) && (() => {
        const v = element.integer_value || element.float_value!;
        return (
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Numeric Range</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Minimum', value: v.min },
                { label: 'Maximum', value: v.max },
                { label: 'Step', value: v.step },
                { label: 'Unit', value: v.unit },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg bg-slate-50 dark:bg-slate-700/50 p-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{value ?? '—'}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Index codes */}
      {element.index_codes && element.index_codes.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Ontology Codes</h2>
          <div className="space-y-2">
            {element.index_codes.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">{c.system}</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{c.code}</span>
                <span className="text-slate-300 dark:text-slate-600">—</span>
                <span className="text-slate-600 dark:text-slate-400">{c.display}</span>
                {(c.url || c.href) && (
                  <a href={c.url || c.href} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:text-brand-600">
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Version info */}
      {element.element_version && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Version Information</h2>
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-xs text-slate-500">Version</p>
              <p className="font-semibold text-slate-900 dark:text-white">{element.element_version.number}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Date</p>
              <p className="font-semibold text-slate-900 dark:text-white">{element.element_version.date?.split('T')[0]}</p>
            </div>
            {element.schema_version && (
              <div>
                <p className="text-xs text-slate-500">Schema</p>
                <p className="font-semibold text-slate-900 dark:text-white">{element.schema_version}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
