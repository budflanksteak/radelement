/**
 * DuplicateWarning
 *
 * As an author types a CDE set or element name, this component searches the
 * live RadElement repository for conceptually similar items. If matches are
 * found, an amber warning banner is displayed with options to:
 *   - View the existing set in a new tab
 *   - Fork it directly as a new draft (for set-level matches only)
 *   - Dismiss the warning and continue creating a new set/element
 *
 * The cache in useDuplicateDetection means the API is only called once per
 * app session regardless of how many characters the author types.
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ExternalLink, GitFork, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useDuplicateDetection } from '../../hooks/useDuplicateDetection';
import { useAuthStore } from '../../store/authStore';
import { useDraftsStore } from '../../store/draftsStore';
import { fetchSetById } from '../../api/radelement';
import { CDESet, getStatusName } from '../../types/cde';
import { StatusBadge } from './StatusBadge';

interface DuplicateWarningProps {
  query: string;
  type?: 'set' | 'element';
  enabled?: boolean;
}

export function DuplicateWarning({
  query,
  type = 'set',
  enabled = true,
}: DuplicateWarningProps) {
  const { similarSets, similarElements, loading } = useDuplicateDetection(
    query,
    type,
    enabled,
  );
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [forkingId, setForkingId] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { createDraft } = useDraftsStore();
  const navigate = useNavigate();

  // Reset dismissal when the author changes the name enough to get new results
  const resultKey =
    type === 'set'
      ? similarSets.map(r => r.set.id).join(',')
      : similarElements.map(r => r.id).join(',');

  useEffect(() => {
    setDismissed(false);
  }, [resultKey]);

  const handleFork = async (setId: string) => {
    if (!user) return;
    setForkingId(setId);
    try {
      const data = await fetchSetById(setId);
      const s = data as CDESet;
      const draft = createDraft(user.id, user.name, {
        name: `${s.name} (draft)`,
        description: s.description,
        elements: s.elements,
        specialties: s.specialties,
        modalities: s.modalities,
        body_parts: s.body_parts,
      });
      navigate(`/editor/${draft.id}`);
    } catch {
      // silently ignore
    } finally {
      setForkingId(null);
    }
  };

  const totalMatches =
    type === 'set' ? similarSets.length : similarElements.length;

  if (!enabled || dismissed || totalMatches === 0 || loading) return null;

  return (
    <div
      className={clsx(
        'rounded-xl border overflow-hidden',
        type === 'set'
          ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/10'
          : 'border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-900/10',
      )}
    >
      {/* Banner header */}
      <div className="flex items-center gap-2 px-4 py-2.5">
        <AlertTriangle
          size={14}
          className={clsx(
            'shrink-0',
            type === 'set'
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-sky-600 dark:text-sky-400',
          )}
        />
        <p
          className={clsx(
            'flex-1 text-sm font-medium',
            type === 'set'
              ? 'text-amber-800 dark:text-amber-300'
              : 'text-sky-800 dark:text-sky-300',
          )}
        >
          {totalMatches} similar {type === 'set' ? 'set' : 'element'}
          {totalMatches > 1 ? 's' : ''} found in the RadElement repository —
          consider forking instead of duplicating
        </p>
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className={clsx(
            'transition-colors',
            type === 'set'
              ? 'text-amber-500 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-300'
              : 'text-sky-500 hover:text-sky-700 dark:text-sky-500 dark:hover:text-sky-300',
          )}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          title="I'll create a new one anyway"
          className={clsx(
            'transition-colors',
            type === 'set'
              ? 'text-amber-400 hover:text-amber-600 dark:hover:text-amber-200'
              : 'text-sky-400 hover:text-sky-600 dark:hover:text-sky-200',
          )}
        >
          <X size={14} />
        </button>
      </div>

      {/* Match list */}
      {expanded && (
        <div
          className={clsx(
            'divide-y border-t',
            type === 'set'
              ? 'divide-amber-100 border-amber-200 dark:divide-amber-800/50 dark:border-amber-800'
              : 'divide-sky-100 border-sky-200 dark:divide-sky-800/50 dark:border-sky-800',
          )}
        >
          {/* Set matches */}
          {type === 'set' &&
            similarSets.map(({ set, score }) => {
              const status = getStatusName(set.status as Parameters<typeof getStatusName>[0]);
              const isHighMatch = score >= 0.7;
              return (
                <div key={set.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-xs text-amber-600 dark:text-amber-400">
                        {set.id}
                      </span>
                      <StatusBadge status={status} size="sm" />
                      {isHighMatch && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                          Strong match
                        </span>
                      )}
                    </div>
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {set.name}
                    </p>
                    {set.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                        {set.description}
                      </p>
                    )}
                    {set.version && (
                      <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                        v{set.version}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Link
                      to={`/sets/${set.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg border border-amber-200 px-2.5 py-1 text-xs text-amber-700 transition-colors hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30"
                    >
                      <ExternalLink size={11} /> View
                    </Link>
                    {user && (user.role === 'author' || user.role === 'admin') && (
                      <button
                        type="button"
                        onClick={() => handleFork(set.id)}
                        disabled={forkingId === set.id}
                        className="flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-200 disabled:opacity-50 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-900/50"
                      >
                        <GitFork size={11} />
                        {forkingId === set.id ? 'Forking…' : 'Fork this'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

          {/* Element matches */}
          {type === 'element' &&
            similarElements.map(el => (
              <div key={el.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-xs text-sky-600 dark:text-sky-400">
                      {el.id}
                    </span>
                    {el.parentSet && (
                      <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                        in {el.parentSet}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {el.name}
                  </p>
                  {el.definition && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                      {el.definition}
                    </p>
                  )}
                </div>
                {el.parentSet && (
                  <Link
                    to={`/sets/${el.parentSet}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex shrink-0 items-center gap-1 rounded-lg border border-sky-200 px-2.5 py-1 text-xs text-sky-700 transition-colors hover:bg-sky-100 dark:border-sky-700 dark:text-sky-300 dark:hover:bg-sky-900/30"
                  >
                    <ExternalLink size={11} /> View set
                  </Link>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
