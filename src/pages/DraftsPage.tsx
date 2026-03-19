import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  FileEdit, Plus, Trash2, Send, Clock, Eye, RotateCcw,
  CheckCircle2, Upload, User as UserIcon, AlertCircle,
} from 'lucide-react';
import { useDraftsStore } from '../store/draftsStore';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { useReviewStore } from '../store/reviewStore';
import type { Draft } from '../types/cde';

// ── Status badge helpers ─────────────────────────────────────────────────────

function StatusBadge({ draft }: { draft: Draft }) {
  if (draft.promoted) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
        <CheckCircle2 size={10} /> Proposed
      </span>
    );
  }
  if (draft.submittedForReview) {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
        In Review
      </span>
    );
  }
  return (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
      Draft
    </span>
  );
}

function cardIconClass(draft: Draft) {
  if (draft.promoted)          return 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400';
  if (draft.submittedForReview) return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
  return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
}

function CardIcon({ draft }: { draft: Draft }) {
  if (draft.promoted)           return <CheckCircle2 size={18} />;
  if (draft.submittedForReview) return <Send size={18} />;
  return <FileEdit size={18} />;
}

// ── Submit-to-RadElement modal stub ─────────────────────────────────────────

function SubmitModal({ draft, onClose }: { draft: Draft; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400">
            <Upload size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">Submit to RadElement</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Publication workflow — coming soon</p>
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-4 mb-5">
          <div className="flex gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="text-sm text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-medium">Submission API not yet configured</p>
              <p className="text-xs">
                This button will initiate the formal submission of{' '}
                <span className="font-mono font-semibold">{draft.set.id}</span>{' '}
                ("{draft.set.name || 'Untitled'}") to the RadElement production registry
                once the publication endpoint is defined. Specifications forthcoming.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400 mb-5">
          <p className="font-medium text-slate-700 dark:text-slate-300">This workflow will include:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Final validation against RadElement schema</li>
            <li>Assignment of permanent RDES / RDE identifiers</li>
            <li>Submission to the ACR RadElement registry</li>
            <li>Publication notification to stakeholders</li>
          </ul>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button disabled className="opacity-50 cursor-not-allowed">
            <Upload size={14} /> Submit (unavailable)
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export function DraftsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    createDraft, deleteDraft, getMyDrafts, getAllDrafts,
    submitForReview, retractFromReview, promoteDraft,
  } = useDraftsStore();
  const { getSetComments } = useReviewStore();
  const [submitTarget, setSubmitTarget] = useState<Draft | null>(null);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  if (!user) return null;

  const isAdmin  = user.role === 'admin';
  const isEditor = user.role === 'editor';
  const seeAll   = isAdmin || isEditor;

  const drafts = seeAll ? getAllDrafts() : getMyDrafts(user.id);

  const pageTitle     = seeAll ? 'All Drafts' : 'My Drafts';
  const emptyTitle    = seeAll ? 'No drafts in the system' : 'No drafts yet';
  const emptySubtitle = seeAll
    ? 'Authors have not created any CDE set drafts yet.'
    : 'Create a new CDE set draft or fork an existing published set to start authoring.';

  const handleNew = () => {
    const draft = createDraft(user.id, user.name);
    navigate(`/editor/${draft.id}`);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete draft "${name || 'Untitled'}"? This cannot be undone.`)) {
      deleteDraft(id);
    }
  };

  const handlePromote = (draft: Draft) => {
    if (confirm(`Promote "${draft.set.name || 'Untitled'}" to Proposed status?\n\nThis marks the set as ready for publication.`)) {
      promoteDraft(draft.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{pageTitle}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {drafts.length} draft{drafts.length !== 1 ? 's' : ''}
          </p>
        </div>
        {(isAdmin || isEditor || user.role === 'author') && (
          <Button onClick={handleNew}>
            <Plus size={16} /> New CDE Set
          </Button>
        )}
      </div>

      {/* Empty state */}
      {drafts.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-16 text-center dark:border-slate-600 dark:bg-slate-800">
          <FileEdit size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{emptyTitle}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">{emptySubtitle}</p>
          {!seeAll && (
            <div className="flex gap-3 justify-center">
              <Button onClick={handleNew}><Plus size={14} /> New CDE Set</Button>
              <Button variant="outline" onClick={() => navigate('/sets')}>Browse existing sets</Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map((draft, idx) => {
            const comments   = getSetComments(draft.set.id);
            const unresolved = comments.filter(c => !c.resolved).length;
            const isOwn      = draft.authorId === user.id;
            const canEdit    = (isAdmin || isEditor || isOwn) && !draft.promoted;

            return (
              <div
                key={`${draft.id}-${idx}`}
                className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 flex items-start gap-4"
              >
                {/* Icon */}
                <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cardIconClass(draft)}`}>
                  <CardIcon draft={draft} />
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs text-slate-400 dark:text-slate-500">{draft.set.id}</span>
                    <StatusBadge draft={draft} />
                    {unresolved > 0 && (
                      <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
                        {unresolved} comment{unresolved !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {draft.set.name || <span className="italic text-slate-400">Untitled CDE Set</span>}
                  </h3>
                  {draft.set.description && (
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{draft.set.description}</p>
                  )}

                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      Updated {new Date(draft.updatedAt).toLocaleDateString()}
                    </span>
                    <span>{draft.set.elements.length} element{draft.set.elements.length !== 1 ? 's' : ''}</span>
                    {/* Show author when viewing all drafts */}
                    {seeAll && (
                      <span className="flex items-center gap-1">
                        <UserIcon size={11} />
                        {draft.authorName || 'Unknown author'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  {canEdit ? (
                    <Button size="sm" onClick={() => navigate(`/editor/${draft.id}`)}>
                      <FileEdit size={12} /> Edit
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => navigate(`/sets/${draft.set.id}`)}>
                      <Eye size={12} /> Preview
                    </Button>
                  )}

                  {/* Submit for review — own non-promoted drafts */}
                  {isOwn && !draft.submittedForReview && !draft.promoted && (
                    <Button size="sm" variant="secondary" onClick={() => submitForReview(draft.id)}>
                      <Send size={12} /> Submit
                    </Button>
                  )}

                  {/* Retract — own, submitted, not promoted */}
                  {isOwn && draft.submittedForReview && !draft.promoted && (
                    <button
                      onClick={() => {
                        if (confirm('Retract from review? The draft will return to editable state. Existing comments are preserved.')) {
                          retractFromReview(draft.id);
                        }
                      }}
                      className="flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                    >
                      <RotateCcw size={12} /> Retract
                    </button>
                  )}

                  {/* Admin: Promote to Proposed */}
                  {isAdmin && !draft.promoted && (
                    <button
                      onClick={() => handlePromote(draft)}
                      className="flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                    >
                      <CheckCircle2 size={12} /> Promote
                    </button>
                  )}

                  {/* Admin: Submit to RadElement (only after promotion) */}
                  {isAdmin && draft.promoted && (
                    <button
                      onClick={() => setSubmitTarget(draft)}
                      className="flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 transition-colors"
                    >
                      <Upload size={12} /> Submit to RadElement
                    </button>
                  )}

                  {/* Delete — admin can delete any; authors delete their own */}
                  {(isAdmin || isOwn) && (
                    <button
                      onClick={() => handleDelete(draft.id, draft.set.name)}
                      className="flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Authoring guidelines — shown to authors and editors, not admins */}
      {!isAdmin && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-900/20">
          <h3 className="text-sm font-semibold text-brand-800 dark:text-brand-300 mb-1">CDE Authoring Guidelines</h3>
          <ul className="text-xs text-brand-700 dark:text-brand-400 space-y-1 list-disc list-inside">
            <li>Set name format: "(Modality) (Body region) (Finding or reason) (Setting)"</li>
            <li>Use Title Case for set names; sentence case for element names; lower case for values</li>
            <li>All elements must have a clear definition (more than a few words)</li>
            <li>Prefer UCUM units (mL, mm, HU) — avoid cm³</li>
            <li>Reference peer-reviewed literature in element definitions</li>
          </ul>
          <Link to="/about" className="mt-2 inline-block text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400">
            Read full authoring guide →
          </Link>
        </div>
      )}

      {/* Submit-to-RadElement modal stub */}
      {submitTarget && (
        <SubmitModal draft={submitTarget} onClose={() => setSubmitTarget(null)} />
      )}
    </div>
  );
}
