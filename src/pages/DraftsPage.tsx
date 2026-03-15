import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { FileEdit, Plus, Trash2, Send, Clock, Eye, RotateCcw } from 'lucide-react';
import { useDraftsStore } from '../store/draftsStore';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { useReviewStore } from '../store/reviewStore';

export function DraftsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createDraft, deleteDraft, getMyDrafts, submitForReview, retractFromReview } = useDraftsStore();
  const { getSetComments } = useReviewStore();

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  if (!user) return null;

  const myDrafts = getMyDrafts(user.id);

  const handleNew = () => {
    const draft = createDraft(user.id, user.name);
    navigate(`/editor/${draft.id}`);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete draft "${name || 'Untitled'}"? This cannot be undone.`)) {
      deleteDraft(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Drafts</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {myDrafts.length} draft{myDrafts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus size={16} /> New CDE Set
        </Button>
      </div>

      {myDrafts.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-16 text-center dark:border-slate-600 dark:bg-slate-800">
          <FileEdit size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No drafts yet</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
            Create a new CDE set draft or fork an existing published set to start authoring.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleNew}>
              <Plus size={14} /> New CDE Set
            </Button>
            <Button variant="outline" onClick={() => navigate('/sets')}>
              Browse existing sets
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {myDrafts.map((draft, idx) => {
            const comments = getSetComments(draft.set.id);
            const unresolved = comments.filter(c => !c.resolved).length;

            return (
              <div key={`${draft.id}-${idx}`}
                className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 flex items-start gap-4">
                <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  draft.submittedForReview
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                  {draft.submittedForReview ? <Send size={18} /> : <FileEdit size={18} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs text-slate-400 dark:text-slate-500">{draft.set.id}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      draft.submittedForReview
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                    }`}>
                      {draft.submittedForReview ? 'In Review' : 'Draft'}
                    </span>
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

                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      Updated {new Date(draft.updatedAt).toLocaleDateString()}
                    </span>
                    <span>{draft.set.elements.length} elements</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  {!draft.submittedForReview ? (
                    <>
                      <Button size="sm" onClick={() => navigate(`/editor/${draft.id}`)}>
                        <FileEdit size={12} /> Edit
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => {
                        submitForReview(draft.id);
                      }}>
                        <Send size={12} /> Submit
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/sets/${draft.set.id}`)}>
                        <Eye size={12} /> Preview
                      </Button>
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
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(draft.id, draft.set.name)}
                    className="flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info box */}
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
    </div>
  );
}
