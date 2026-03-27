import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Save, Plus, Trash2, ChevronUp, ChevronDown, Send,
  GripVertical, X, AlertCircle, CheckCircle, Hash, ToggleLeft, Ruler,
  Search, Loader2
} from 'lucide-react';
import { useDraftsStore } from '../store/draftsStore';
import { useAuthStore } from '../store/authStore';
import { CDESet, CDEElement, ElementValue, ValueSet, IntegerValue, FloatValue, Specialty, BodyPart, IndexCode } from '../types/cde';
import { Input, Textarea } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { SPECIALTIES, MODALITIES, INDEX_SYSTEMS } from '../data/mockData';
import { clsx } from 'clsx';
import { fetchSetById } from '../api/radelement';
import { OntologySuggest } from '../components/cde/OntologySuggest';
import { DuplicateWarning } from '../components/cde/DuplicateWarning';
import { useOntologySearch } from '../hooks/useOntologySearch';
import { OntologyTerm } from '../hooks/useOntologySearch';

// ── Helpers ────────────────────────────────────────────────────────────────

function newElementId(): string {
  return `RDETO_BE_DETERMINED${Math.floor(Math.random() * 9000) + 1000}`;
}

function blankElement(): CDEElement {
  return {
    id: newElementId(),
    name: '',
    definition: '',
    question: '',
    schema_version: '1.0.0',
    element_version: { number: 1, date: new Date().toISOString().split('T')[0] },
    value_set: { min_cardinality: 1, max_cardinality: 1, values: [] },
  };
}

// ── Element type selector ──────────────────────────────────────────────────

function ElementTypeSelector({
  element,
  onChange,
}: {
  element: CDEElement;
  onChange: (updates: Partial<CDEElement>) => void;
}) {
  const current = element.value_set ? 'value_set' : element.integer_value ? 'integer' : 'float';

  function switchType(t: 'value_set' | 'integer' | 'float') {
    const base = { value_set: undefined, integer_value: undefined, float_value: undefined };
    if (t === 'value_set') onChange({ ...base, value_set: { min_cardinality: 1, max_cardinality: 1, values: [] } });
    else if (t === 'integer') onChange({ ...base, integer_value: { min: undefined, max: undefined, step: 1, unit: '' } });
    else onChange({ ...base, float_value: { min: undefined, max: undefined, step: 0.1, unit: '' } });
  }

  return (
    <div className="flex gap-2">
      {([
        { key: 'value_set', icon: <ToggleLeft size={14} />, label: 'Value Set' },
        { key: 'integer', icon: <Hash size={14} />, label: 'Integer' },
        { key: 'float', icon: <Ruler size={14} />, label: 'Float' },
      ] as const).map(({ key, icon, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => switchType(key)}
          className={clsx(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors',
            current === key
              ? 'border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-600 dark:bg-brand-900/30 dark:text-brand-300'
              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400'
          )}
        >
          {icon} {label}
        </button>
      ))}
    </div>
  );
}

// ── Value Set Editor ───────────────────────────────────────────────────────

// ── BodyPartInput ──────────────────────────────────────────────────────────
// Wraps a single body-part name field with live RadLex / SNOMED CT suggestions.

function BodyPartInput({
  bp,
  onChange,
  onRemove,
}: {
  bp: BodyPart;
  onChange: (bp: BodyPart) => void;
  onRemove: () => void;
}) {
  const [query, setQuery] = useState('');
  const [showSuggest, setShowSuggest] = useState(false);

  const handleSelect = (term: OntologyTerm) => {
    const code: IndexCode = { system: term.system, code: term.code, display: term.display, url: term.href };
    const existing = Array.isArray(bp.index_codes)
      ? bp.index_codes
      : bp.index_codes ? [bp.index_codes] : [];
    onChange({ ...bp, name: term.display, index_codes: [...existing, code] });
    setShowSuggest(false);
  };

  const codeCount = Array.isArray(bp.index_codes)
    ? bp.index_codes.length
    : bp.index_codes ? 1 : 0;

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <input
          value={bp.name}
          onChange={e => { onChange({ ...bp, name: e.target.value }); setQuery(e.target.value); }}
          onFocus={() => { setQuery(bp.name); setShowSuggest(true); }}
          onBlur={() => setTimeout(() => setShowSuggest(false), 200)}
          placeholder="e.g. Lung, Liver, Brain"
          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:border-brand-400"
        />
        <OntologySuggest
          query={query}
          visible={showSuggest}
          onSelect={handleSelect}
          onClose={() => setShowSuggest(false)}
        />
      </div>
      {codeCount > 0 && (
        <span className="shrink-0 text-xs text-violet-500 dark:text-violet-400">
          {codeCount} code{codeCount > 1 ? 's' : ''}
        </span>
      )}
      <button type="button" onClick={onRemove} className="text-slate-400 hover:text-red-500 transition-colors">
        <X size={14} />
      </button>
    </div>
  );
}

// ── ValueNameInput ─────────────────────────────────────────────────────────
// Wraps the display-name cell of a value-set row with ontology suggestions.

function ValueNameInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string, code?: IndexCode) => void;
}) {
  const [query, setQuery] = useState('');
  const [showSuggest, setShowSuggest] = useState(false);

  const handleSelect = (term: OntologyTerm) => {
    onChange(term.display, { system: term.system, code: term.code, display: term.display, url: term.href });
    setShowSuggest(false);
  };

  return (
    <div className="relative flex-1">
      <input
        placeholder="Display name"
        value={value}
        onChange={e => { onChange(e.target.value); setQuery(e.target.value); }}
        onFocus={() => { setQuery(value); setShowSuggest(true); }}
        onBlur={() => setTimeout(() => setShowSuggest(false), 200)}
        className="w-full rounded border border-slate-200 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:border-brand-400"
      />
      <OntologySuggest
        query={query}
        visible={showSuggest}
        onSelect={handleSelect}
        onClose={() => setShowSuggest(false)}
      />
    </div>
  );
}

// ── ValueSetEditor ─────────────────────────────────────────────────────────

function ValueSetEditor({
  vs,
  onChange,
}: {
  vs: ValueSet;
  onChange: (vs: ValueSet) => void;
}) {
  const addValue = () => {
    const idx = vs.values.length;
    onChange({
      ...vs,
      values: [...vs.values, { code: '', value: '', name: '', definition: '' }],
    });
  };

  const updateValue = (i: number, updates: Partial<ElementValue>) => {
    const values = vs.values.map((v, j) => j === i ? { ...v, ...updates } : v);
    onChange({ ...vs, values });
  };

  const removeValue = (i: number) => {
    onChange({ ...vs, values: vs.values.filter((_, j) => j !== i) });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Min selections</label>
          <input
            type="number"
            min={0}
            max={vs.max_cardinality}
            value={vs.min_cardinality}
            onChange={e => onChange({ ...vs, min_cardinality: Number(e.target.value) })}
            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:border-brand-400"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Max selections</label>
          <input
            type="number"
            min={1}
            value={vs.max_cardinality}
            onChange={e => onChange({ ...vs, max_cardinality: Number(e.target.value) })}
            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:border-brand-400"
          />
        </div>
      </div>

      {vs.values.map((v, i) => (
        <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-600">
          <span className="text-xs text-slate-400 font-mono w-6 shrink-0">{i}</span>
          <input
            placeholder="value (e.g. present)"
            value={v.value}
            onChange={e => updateValue(i, { value: e.target.value })}
            className="flex-1 rounded border border-slate-200 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:border-brand-400"
          />
          <ValueNameInput
            value={v.name}
            onChange={(name, code) => updateValue(i, {
              name,
              ...(code ? { index_codes: [...(v.index_codes || []), code] } : {}),
            })}
          />
          {(() => {
            const n = Array.isArray(v.index_codes) ? v.index_codes.length : v.index_codes ? 1 : 0;
            return n > 0 ? (
              <span className="shrink-0 text-xs text-violet-500 font-medium">{n} code{n > 1 ? 's' : ''}</span>
            ) : null;
          })()}
          <input
            placeholder="Definition (optional)"
            value={v.definition || ''}
            onChange={e => updateValue(i, { definition: e.target.value })}
            className="flex-1 rounded border border-slate-200 px-2 py-1 text-xs dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:border-brand-400 hidden md:block"
          />
          <button onClick={() => removeValue(i)} className="text-slate-400 hover:text-red-500 transition-colors">
            <X size={14} />
          </button>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addValue}>
        <Plus size={14} /> Add value
      </Button>
    </div>
  );
}

// ── Numeric Value Editor ───────────────────────────────────────────────────

function NumericEditor({
  value,
  onChange,
}: {
  value: IntegerValue | FloatValue;
  onChange: (v: IntegerValue | FloatValue) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {(['min', 'max', 'step'] as const).map(field => (
        <div key={field}>
          <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1 capitalize">{field}</label>
          <input
            type="number"
            value={(value as any)[field] ?? ''}
            onChange={e => onChange({ ...value, [field]: e.target.value ? Number(e.target.value) : undefined })}
            placeholder="—"
            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:border-brand-400"
          />
        </div>
      ))}
      <div>
        <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Unit (UCUM)</label>
        <input
          value={value.unit || ''}
          onChange={e => onChange({ ...value, unit: e.target.value })}
          placeholder="e.g. mm, HU, mL"
          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:border-brand-400"
        />
      </div>
    </div>
  );
}

// ── Element Editor ─────────────────────────────────────────────────────────

function ElementEditor({
  element,
  index,
  total,
  onUpdate,
  onRemove,
  onMove,
}: {
  element: CDEElement;
  index: number;
  total: number;
  onUpdate: (el: CDEElement) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [ontologyQuery, setOntologyQuery] = useState('');
  const [showOntology, setShowOntology] = useState(false);
  const update = (updates: Partial<CDEElement>) => onUpdate({ ...element, ...updates });

  const handleOntologySelect = (term: OntologyTerm) => {
    const existing = element.index_codes || [];
    // Avoid duplicates
    if (!existing.some(c => c.code === term.code && c.system === term.system)) {
      update({
        index_codes: [...existing, {
          system: term.system,
          code: term.code,
          display: term.display,
          href: term.href,
        }],
      });
    }
    setShowOntology(false);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-700/50">
        <GripVertical size={16} className="text-slate-300 dark:text-slate-600 cursor-grab" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-slate-400 dark:text-slate-500">{element.id}</span>
            <span className={clsx(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              element.value_set ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' :
              element.integer_value ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
              'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
            )}>
              {element.value_set ? 'Value Set' : element.integer_value ? 'Integer' : 'Float'}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-900 dark:text-white truncate mt-0.5">
            {element.name || <span className="text-slate-400 italic">Untitled element</span>}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onMove(-1)} disabled={index === 0} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30">
            <ChevronUp size={14} />
          </button>
          <button onClick={() => onMove(1)} disabled={index === total - 1} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30">
            <ChevronDown size={14} />
          </button>
          <button onClick={onRemove} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
            <Trash2 size={14} />
          </button>
          <button onClick={() => setExpanded(v => !v)} className="p-1 text-slate-400 hover:text-slate-600">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Element name + live ontology suggest */}
            <div className="relative">
              <Input
                label="Element name"
                value={element.name}
                onChange={e => {
                  update({ name: e.target.value });
                  setOntologyQuery(e.target.value);
                }}
                onFocus={() => { setOntologyQuery(element.name); setShowOntology(true); }}
                onBlur={() => setTimeout(() => setShowOntology(false), 200)}
                placeholder="e.g. Presence, Size, Composition"
                hint="Sentence case. Type to search RadLex / SNOMED CT terms."
              />
              <OntologySuggest
                query={ontologyQuery}
                visible={showOntology}
                onSelect={handleOntologySelect}
                onClose={() => setShowOntology(false)}
              />
              {/* Badge showing attached codes */}
              {(element.index_codes?.length ?? 0) > 0 && (
                <p className="mt-1 text-xs text-violet-600 dark:text-violet-400">
                  {element.index_codes!.length} ontology code{element.index_codes!.length > 1 ? 's' : ''} linked
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Value type</label>
              <ElementTypeSelector element={element} onChange={updates => onUpdate({ ...element, ...updates })} />
            </div>
          </div>

          {/* Element-level duplicate detection */}
          <DuplicateWarning
            query={element.name}
            type="element"
            enabled={element.name.trim().length >= 3}
          />

          <Textarea
            label="Definition"
            value={element.definition}
            onChange={e => update({ definition: e.target.value })}
            rows={3}
            placeholder="Full semantic description of this element's intended clinical use…"
            hint="Required. Must be more than a few words. Should justify element completeness."
          />

          <Input
            label="Question (optional)"
            value={element.question || ''}
            onChange={e => update({ question: e.target.value })}
            placeholder="How would a radiologist be prompted to answer this?"
          />

          {/* Value type specific */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">
              {element.value_set ? 'Allowed Values' : 'Numeric Constraints'}
            </label>
            {element.value_set && (
              <ValueSetEditor
                vs={element.value_set}
                onChange={vs => update({ value_set: vs })}
              />
            )}
            {element.integer_value && (
              <NumericEditor value={element.integer_value} onChange={v => update({ integer_value: v as IntegerValue })} />
            )}
            {element.float_value && (
              <NumericEditor value={element.float_value} onChange={v => update({ float_value: v as FloatValue })} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Ontology Search Panel (Ontology tab) ───────────────────────────────────

const SYSTEM_BADGE: Record<string, string> = {
  RADLEX: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  SNOMEDCT: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
};

function OntologySearchPanel({ onAdd }: { onAdd: (term: OntologyTerm) => void }) {
  const [query, setQuery] = useState('');
  const { results, loading } = useOntologySearch(query, query.length >= 2);
  const [added, setAdded] = useState<Set<string>>(new Set());

  const handleAdd = (term: OntologyTerm) => {
    onAdd(term);
    setAdded(prev => new Set([...prev, `${term.system}:${term.code}`]));
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Search Ontologies</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Search RadLex and SNOMED CT to find standardized terms and add their codes to this set.
        </p>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder='e.g. "pulmonary nodule", "hepatic lesion", "lymphadenopathy"'
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-10 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
        />
        {loading && (
          <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
        )}
        {query && !loading && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Results table */}
      {results.length > 0 && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 w-24">System</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 w-32">Code</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">Term</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {results.map(term => {
                const key = `${term.system}:${term.code}`;
                const isAdded = added.has(key);
                return (
                  <tr key={key} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-3 py-2">
                      <span className={clsx('rounded px-1.5 py-0.5 text-xs font-semibold', SYSTEM_BADGE[term.system] || 'bg-slate-100 text-slate-600')}>
                        {term.system === 'SNOMEDCT' ? 'SNOMED' : term.system}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-500 dark:text-slate-400">{term.code}</td>
                    <td className="px-3 py-2 text-slate-900 dark:text-white">
                      {term.display}
                      {term.href && (
                        <a href={term.href} target="_blank" rel="noopener noreferrer"
                          className="ml-1.5 inline-text text-slate-300 hover:text-brand-500 transition-colors">
                          ↗
                        </a>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleAdd(term)}
                        disabled={isAdded}
                        className={clsx(
                          'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                          isAdded
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 cursor-default'
                            : 'bg-brand-600 text-white hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600'
                        )}
                      >
                        {isAdded ? '✓ Added' : '+ Add'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {query.length >= 2 && !loading && results.length === 0 && (
        <p className="text-sm text-slate-400 dark:text-slate-500 italic text-center py-2">
          No matching ontology terms found for "{query}"
        </p>
      )}
      {query.length < 2 && (
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Type at least 2 characters to search RadLex and SNOMED CT
        </p>
      )}
    </div>
  );
}

// ── Main Editor Page ───────────────────────────────────────────────────────

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthStore();
  const { createDraft, updateDraft, getDraft, submitForReview } = useDraftsStore();
  const initialized = useRef(false);

  const [draft, setDraftLocal] = useState(() => {
    if (id === 'new') return null;
    return id ? getDraft(id) : null;
  });
  const [set, setSet] = useState<CDESet | null>(null);
  const [loading, setLoading] = useState(id !== 'new' && !draft);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<'info' | 'elements' | 'codes'>('info');

  // Redirect if not logged in — wait for auth to finish loading first
  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  // Initialize — re-runs once user is confirmed loaded (guards against
  // the race where auth hasn't resolved yet when the component mounts)
  useEffect(() => {
    if (!user) return;               // auth still loading — wait
    if (initialized.current) return; // already ran — don't duplicate
    initialized.current = true;

    if (id === 'new') {
      const newDraft = createDraft(user.id, user.name);
      setDraftLocal(newDraft);
      setSet(newDraft.set);
      navigate(`/editor/${newDraft.id}`, { replace: true });
    } else if (id && !draft) {
      // Check if it's an existing published set being forked
      setLoading(true);
      fetchSetById(id)
        .then(data => {
          const s = data as CDESet;
          const newDraft = createDraft(user.id, user.name, {
            name: `${s.name} (draft)`,
            description: s.description,
            elements: s.elements,
            specialties: s.specialties,
            modalities: s.modalities,
            body_parts: s.body_parts,
          });
          setDraftLocal(newDraft);
          setSet(newDraft.set);
          navigate(`/editor/${newDraft.id}`, { replace: true });
        })
        .catch(() => {
          navigate('/drafts');
        })
        .finally(() => setLoading(false));
    } else if (draft) {
      setSet(draft.set);
    }
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback(() => {
    if (!draft || !set) return;
    const errs: string[] = [];
    if (!set.name.trim()) errs.push('Set name is required');
    if (!set.description.trim()) errs.push('Description is required');
    if (set.elements.some(el => !el.name.trim())) errs.push('All elements must have a name');
    if (set.elements.some(el => !el.definition.trim())) errs.push('All elements must have a definition');

    setErrors(errs);
    if (errs.length > 0) return;

    setSaving(true);
    setTimeout(() => {
      updateDraft(draft.id, set);
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 300);
  }, [draft, set, updateDraft]);

  const handleSubmitForReview = () => {
    if (!draft) return;
    handleSave();
    submitForReview(draft.id);
    navigate('/drafts');
  };

  // Set-level field updater
  const updateSet = (updates: Partial<CDESet>) => setSet(s => s ? { ...s, ...updates } : null);

  const addElement = () => {
    setSet(s => s ? { ...s, elements: [...s.elements, blankElement()] } : null);
    setActiveSection('elements');
  };

  const updateElement = (i: number, el: CDEElement) => {
    setSet(s => s ? { ...s, elements: s.elements.map((e, j) => j === i ? el : e) } : null);
  };

  const removeElement = (i: number) => {
    setSet(s => s ? { ...s, elements: s.elements.filter((_, j) => j !== i) } : null);
  };

  const moveElement = (i: number, dir: -1 | 1) => {
    setSet(s => {
      if (!s) return null;
      const els = [...s.elements];
      const j = i + dir;
      if (j < 0 || j >= els.length) return s;
      [els[i], els[j]] = [els[j], els[i]];
      return { ...s, elements: els };
    });
  };

  const toggleSpecialty = (sp: Specialty) => {
    const specialties = set?.specialties || [];
    const exists = specialties.some(s => s.abbreviation === sp.abbreviation);
    updateSet({ specialties: exists ? specialties.filter(s => s.abbreviation !== sp.abbreviation) : [...specialties, sp] });
  };

  const toggleModality = (mod: string) => {
    const mods = set?.modalities || [];
    const exists = mods.includes(mod as any);
    updateSet({ modalities: exists ? mods.filter(m => m !== mod) : [...mods, mod as any] });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
    </div>
  );

  if (!set) return null;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm text-slate-400 dark:text-slate-500">{set.id}</span>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Draft</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {set.name || 'Untitled CDE Set'}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/drafts')}>Discard</Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSave}
            loading={saving}
          >
            {saved ? <><CheckCircle size={14} /> Saved</> : <><Save size={14} /> Save Draft</>}
          </Button>
          <Button size="sm" onClick={handleSubmitForReview}>
            <Send size={14} /> Submit for Review
          </Button>
        </div>
      </div>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium mb-2">
            <AlertCircle size={16} />
            Please fix the following:
          </div>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((e, i) => (
              <li key={i} className="text-sm text-red-600 dark:text-red-400">{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Section tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {(['info', 'elements', 'codes'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSection(tab)}
            className={clsx(
              'flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-colors',
              activeSection === tab
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            )}
          >
            {tab === 'elements' ? `Elements (${set.elements.length})` : tab === 'info' ? 'Set Info' : 'Ontology'}
          </button>
        ))}
      </div>

      {/* Set Info section */}
      {activeSection === 'info' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Basic Information</h2>
            <Input
              label="Set name *"
              value={set.name}
              onChange={e => updateSet({ name: e.target.value })}
              placeholder='e.g. "CT Chest Pulmonary Nodule"'
              hint='Format: "(Modality) (Body region) (Finding) (Setting)". Use Title Case.'
            />
            {/* Duplicate detection — warns if similar sets exist in the live repo */}
            <DuplicateWarning query={set.name} type="set" enabled={set.name.trim().length >= 3} />
            <Textarea
              label="Description *"
              value={set.description}
              onChange={e => updateSet({ description: e.target.value })}
              rows={4}
              placeholder="Full description of the clinical scenario, intended use, and scope of this CDE set…"
            />
          </div>

          {/* Modalities */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Modalities</h2>
            <div className="flex flex-wrap gap-2">
              {MODALITIES.map(m => {
                const active = (set.modalities || []).includes(m.code as any);
                return (
                  <button
                    key={m.code}
                    type="button"
                    onClick={() => toggleModality(m.code)}
                    className={clsx(
                      'rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors',
                      active
                        ? 'border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-600 dark:bg-brand-900/30 dark:text-brand-300'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400'
                    )}
                  >
                    {m.code}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Specialties */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Specialties</h2>
            <div className="flex flex-wrap gap-2">
              {SPECIALTIES.map(sp => {
                const active = (set.specialties || []).some(s => s.abbreviation === sp.abbreviation);
                return (
                  <button
                    key={sp.abbreviation}
                    type="button"
                    onClick={() => toggleSpecialty(sp)}
                    className={clsx(
                      'rounded-lg px-3 py-1.5 text-sm border transition-colors',
                      active
                        ? 'border-teal-400 bg-teal-50 text-teal-700 dark:border-teal-600 dark:bg-teal-900/30 dark:text-teal-300'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400'
                    )}
                  >
                    {sp.abbreviation} – {sp.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body parts */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Body Parts</h2>
              <Button type="button" variant="outline" size="sm" onClick={() =>
                updateSet({ body_parts: [...(set.body_parts || []), { name: '' }] })
              }>
                <Plus size={12} /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {(set.body_parts || []).map((bp, i) => (
                <BodyPartInput
                  key={i}
                  bp={bp}
                  onChange={updated => {
                    const bps = [...(set.body_parts || [])];
                    bps[i] = updated;
                    updateSet({ body_parts: bps });
                  }}
                  onRemove={() => updateSet({ body_parts: (set.body_parts || []).filter((_, j) => j !== i) })}
                />
              ))}
              {!(set.body_parts?.length) && (
                <p className="text-sm text-slate-400 dark:text-slate-500">No body parts added yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Elements section */}
      {activeSection === 'elements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {set.elements.length} element{set.elements.length !== 1 ? 's' : ''}
            </p>
            <Button onClick={addElement} size="sm">
              <Plus size={14} /> Add Element
            </Button>
          </div>

          {set.elements.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-600 dark:bg-slate-800">
              <p className="text-slate-500 dark:text-slate-400 mb-3">No elements yet. Add your first element to get started.</p>
              <Button onClick={addElement}><Plus size={14} /> Add First Element</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {set.elements.map((el, i) => (
                <ElementEditor
                  key={el.id}
                  element={el}
                  index={i}
                  total={set.elements.length}
                  onUpdate={updated => updateElement(i, updated)}
                  onRemove={() => removeElement(i)}
                  onMove={dir => moveElement(i, dir)}
                />
              ))}
            </div>
          )}

          {set.elements.length > 0 && (
            <Button onClick={addElement} variant="outline" className="w-full">
              <Plus size={14} /> Add Another Element
            </Button>
          )}
        </div>
      )}

      {/* Ontology / index codes section */}
      {activeSection === 'codes' && (
        <div className="space-y-4">
          {/* Live ontology search */}
          <OntologySearchPanel
            onAdd={term => {
              const existing = set.index_codes || [];
              if (!existing.some(c => c.code === term.code && c.system === term.system)) {
                updateSet({ index_codes: [...existing, { system: term.system, code: term.code, display: term.display, href: term.href }] });
              }
            }}
          />

          {/* Manually entered / existing codes */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Set-level Index Codes</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Link this CDE set to standardized ontologies: RADLEX, SNOMEDCT, LOINC, or ACRCOMMON.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() =>
                updateSet({ index_codes: [...(set.index_codes || []), { system: 'RADLEX', code: '', display: '' }] })
              }>
                <Plus size={12} /> Add manually
              </Button>
            </div>

            <div className="space-y-2">
              {(set.index_codes || []).map((code, i) => (
                <div key={i} className="grid gap-2 grid-cols-3 sm:grid-cols-4 items-center rounded-lg border border-slate-100 dark:border-slate-700 p-2">
                  <select
                    value={code.system}
                    onChange={e => {
                      const codes = [...(set.index_codes || [])];
                      codes[i] = { ...codes[i], system: e.target.value };
                      updateSet({ index_codes: codes });
                    }}
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:border-brand-400"
                  >
                    {INDEX_SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input
                    placeholder="Code (e.g. RID50149)"
                    value={code.code}
                    onChange={e => {
                      const codes = [...(set.index_codes || [])];
                      codes[i] = { ...codes[i], code: e.target.value };
                      updateSet({ index_codes: codes });
                    }}
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:border-brand-400"
                  />
                  <input
                    placeholder="Display term"
                    value={code.display}
                    onChange={e => {
                      const codes = [...(set.index_codes || [])];
                      codes[i] = { ...codes[i], display: e.target.value };
                      updateSet({ index_codes: codes });
                    }}
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:border-brand-400"
                  />
                  <button
                    type="button"
                    onClick={() => updateSet({ index_codes: (set.index_codes || []).filter((_, j) => j !== i) })}
                    className="text-slate-400 hover:text-red-500 justify-self-start transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {!(set.index_codes?.length) && (
                <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                  No index codes yet. Use the search above or add manually.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 border-t border-slate-200 bg-white/90 backdrop-blur px-6 py-3 flex items-center justify-between dark:border-slate-700 dark:bg-slate-900/90 z-30">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Draft: <span className="font-mono">{set.id}</span> · {set.elements.length} elements
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleSave} loading={saving}>
            {saved ? <><CheckCircle size={14} /> Saved</> : <><Save size={14} /> Save</>}
          </Button>
          <Button size="sm" onClick={handleSubmitForReview}>
            <Send size={14} /> Submit for Review
          </Button>
        </div>
      </div>
    </div>
  );
}
