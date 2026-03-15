import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MessageSquare, CheckCircle, Clock, Eye, Send, Filter } from 'lucide-react';
import { useDraftsStore } from '../store/draftsStore';
import { useAuthStore } from '../store/authStore';
import { useReviewStore } from '../store/reviewStore';
import { Button } from '../components/ui/Button';
import { Draft } from '../types/cde';

export function ReviewPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { drafts } = useDraftsStore();
  const { comments, resolveComment, getSetComments } = useReviewStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  if (!user) return null;

  // Show all submitted drafts
  const submittedDrafts = drafts.filter(d => d.submittedForReview);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Review Queue</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          CDE sets submitted for community review
        </p>
      </div>

      {submittedDrafts.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-16 text-center dark:border-slate-600 dark:bg-slate-800">
          <Send size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No sets in review</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Draft CDE sets submitted for review will appear here.
          </p>
          <Button variant="outline" onClick={() => navigate('/drafts')}>
            View My Drafts
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {submittedDrafts.map(draft => {
            const setComments = getSetComments(draft.set.id);
            const unresolved = setComments.filter(c => !c.resolved).length;
            const resolved = setComments.filter(c => c.resolved).length;

            return (
              <div key={draft.id} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-slate-400 dark:text-slate-500">{draft.set.id}</span>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        Awaiting Review
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {draft.set.name || 'Untitled CDE Set'}
                    </h3>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                      by {draft.authorName}
                    </p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        Submitted {new Date(draft.updatedAt).toLocaleDateString()}
                      </span>
                      <span>{draft.set.elements.length} elements</span>
                      {unresolved > 0 && (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <MessageSquare size={11} /> {unresolved} open
                        </span>
                      )}
                      {resolved > 0 && (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle size={11} /> {resolved} resolved
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/sets/${draft.set.id}`)}>
                      <Eye size={12} /> Review
                    </Button>
                  </div>
                </div>

                {/* Recent comments */}
                {setComments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-2">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Recent comments</p>
                    {setComments.slice(-2).map(c => (
                      <div key={c.id} className="flex items-start gap-2.5">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-semibold dark:bg-brand-900/30 dark:text-brand-300">
                          {c.userName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{c.userName}</span>
                            {c.elementId && (
                              <span className="font-mono text-xs text-slate-400">on {c.elementId}</span>
                            )}
                            <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                            {c.resolved && <CheckCircle size={10} className="text-emerald-500" />}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{c.content}</p>
                        </div>
                        {!c.resolved && (user.role === 'reviewer' || user.role === 'admin') && (
                          <button
                            onClick={() => resolveComment(c.id)}
                            className="shrink-0 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    ))}
                    {setComments.length > 2 && (
                      <Link to={`/sets/${draft.set.id}`} className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400">
                        View all {setComments.length} comments →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
