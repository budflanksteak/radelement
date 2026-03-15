import { useNavigate } from 'react-router-dom';
import { Database, ChevronRight, Download, Layers } from 'lucide-react';
import { CDESetSummary, getStatusName } from '../../types/cde';
import { StatusBadge } from './StatusBadge';
import { MODALITY_COLORS, SPECIALTY_COLORS } from '../../data/mockData';
import { clsx } from 'clsx';

interface SetCardProps {
  set: CDESetSummary & { elementCount?: number };
  compact?: boolean;
}

export function SetCard({ set, compact }: SetCardProps) {
  const navigate = useNavigate();
  const statusName = getStatusName(set.status as any);

  const modalityCodes = set.modality
    ? set.modality.split(',').map(m => m.trim()).filter(Boolean)
    : [];

  return (
    <div
      onClick={() => navigate(`/sets/${set.id}`)}
      className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-brand-300 hover:shadow-md hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-brand-600"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
            <Database size={18} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-semibold text-slate-400 dark:text-slate-500">
                {set.id}
              </span>
              <StatusBadge status={statusName} />
            </div>
            <h3 className="mt-1 font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-tight">
              {set.name}
            </h3>
          </div>
        </div>
        <ChevronRight size={16} className="shrink-0 mt-1 text-slate-300 group-hover:text-brand-500 dark:text-slate-600 transition-colors" />
      </div>

      {!compact && set.description && (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {set.description}
        </p>
      )}

      <div className="mt-4 flex items-center gap-2 flex-wrap">
        {/* Modalities */}
        {modalityCodes.map(mod => (
          <span key={mod} className={clsx(
            'rounded-md px-2 py-0.5 text-xs font-semibold',
            MODALITY_COLORS[mod] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
          )}>
            {mod}
          </span>
        ))}

        {/* Specialties */}
        {set.specialties?.slice(0, 2).map(sp => (
          <span key={sp.code} className={clsx(
            'rounded-md px-2 py-0.5 text-xs font-medium',
            SPECIALTY_COLORS[sp.code] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
          )}>
            {sp.short_name || sp.code}
          </span>
        ))}
        {(set.specialties?.length || 0) > 2 && (
          <span className="text-xs text-slate-400 dark:text-slate-500">
            +{(set.specialties?.length || 0) - 2} more
          </span>
        )}
      </div>

      {!compact && (
        <div className="mt-3 flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
          {set.elementCount !== undefined && (
            <span className="flex items-center gap-1">
              <Layers size={12} />
              {set.elementCount} elements
            </span>
          )}
          {set.downloads !== undefined && (
            <span className="flex items-center gap-1">
              <Download size={12} />
              {set.downloads} downloads
            </span>
          )}
          {set.body_parts && set.body_parts.length > 0 && (
            <span>{set.body_parts.map(b => b.name).join(', ')}</span>
          )}
        </div>
      )}
    </div>
  );
}
