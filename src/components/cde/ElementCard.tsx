import { useNavigate } from 'react-router-dom';
import { Hash, ToggleLeft, Ruler, ChevronRight, List } from 'lucide-react';
import { CDEElement, CDEElementSummary, getElementType } from '../../types/cde';
import { clsx } from 'clsx';

interface ElementCardProps {
  element: CDEElement | CDEElementSummary;
  setId?: string;
  compact?: boolean;
  onClick?: () => void;
}

const TYPE_CONFIG = {
  value_set: { icon: <ToggleLeft size={16} />, label: 'Value Set', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
  integer: { icon: <Hash size={16} />, label: 'Integer', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  float: { icon: <Ruler size={16} />, label: 'Float', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
};

function getTypeFromElement(el: CDEElement | CDEElementSummary): 'value_set' | 'integer' | 'float' {
  // CDEElement (detail format)
  if ('value_set' in el && el.value_set && !Array.isArray(el.value_set)) return 'value_set';
  if ('integer_value' in el && el.integer_value) return 'integer';
  if ('float_value' in el && el.float_value) return 'float';
  // CDEElementSummary (list format)
  if ('valueType' in el) {
    if (el.valueType === 'valueSet') return 'value_set';
    if (el.valueType === 'integer') return 'integer';
    if (el.valueType === 'float') return 'float';
  }
  if ('value_set' in el && Array.isArray(el.value_set) && el.value_set.length > 0) return 'value_set';
  return 'value_set';
}

export function ElementCard({ element, setId, compact, onClick }: ElementCardProps) {
  const navigate = useNavigate();
  const type = getTypeFromElement(element);
  const cfg = TYPE_CONFIG[type];

  const handleClick = () => {
    if (onClick) { onClick(); return; }
    navigate(`/elements/${element.id}`);
  };

  const definition = 'definition' in element ? element.definition : undefined;
  const values = 'value_set' in element && Array.isArray(element.value_set) ? element.value_set : undefined;
  const detailValueSet = 'value_set' in element && !Array.isArray(element.value_set) && element.value_set ? element.value_set : undefined;

  return (
    <div
      onClick={handleClick}
      className="group cursor-pointer rounded-lg border border-slate-200 bg-white p-4 transition-all hover:border-brand-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:hover:border-brand-600"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className={clsx('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md', cfg.color)}>
            {cfg.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-400 dark:text-slate-500">{element.id}</span>
              <span className={clsx('rounded-full px-1.5 py-0.5 text-xs font-medium', cfg.color)}>
                {cfg.label}
              </span>
            </div>
            <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              {element.name || ('shortName' in element ? element.shortName : '') || element.id}
            </p>
          </div>
        </div>
        <ChevronRight size={14} className="shrink-0 mt-1 text-slate-300 group-hover:text-brand-500 dark:text-slate-600 transition-colors" />
      </div>

      {!compact && definition && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 ml-9">
          {definition}
        </p>
      )}

      {/* Value set preview */}
      {!compact && (detailValueSet?.values || values) && (
        <div className="mt-2 ml-9 flex items-center gap-1 flex-wrap">
          <List size={11} className="text-slate-400" />
          {(detailValueSet?.values || values || []).slice(0, 4).map((v, i) => (
            <span key={i} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-400">
              {v.name}
            </span>
          ))}
          {((detailValueSet?.values || values || []).length > 4) && (
            <span className="text-xs text-slate-400">+{(detailValueSet?.values || values || []).length - 4}</span>
          )}
        </div>
      )}

      {/* Numeric range */}
      {!compact && type !== 'value_set' && 'integer_value' in element && element.integer_value && (
        <div className="mt-2 ml-9 text-xs text-slate-500 dark:text-slate-400">
          Range: {element.integer_value.min ?? '–'} – {element.integer_value.max ?? '–'}
          {element.integer_value.unit && <span className="ml-1 text-slate-400">{element.integer_value.unit}</span>}
        </div>
      )}
      {!compact && type !== 'value_set' && 'float_value' in element && element.float_value && (
        <div className="mt-2 ml-9 text-xs text-slate-500 dark:text-slate-400">
          Range: {element.float_value.min ?? '–'} – {element.float_value.max ?? '–'}
          {element.float_value.unit && <span className="ml-1 text-slate-400">{element.float_value.unit}</span>}
        </div>
      )}
    </div>
  );
}
