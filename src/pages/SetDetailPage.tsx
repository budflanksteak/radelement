import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Download, Edit, MessageSquare, ChevronDown, ChevronUp,
  ExternalLink, User, Building2, Calendar, Hash, Globe, Plus, CheckCircle
} from 'lucide-react';
import { fetchSetById } from '../api/radelement';

/** Returns the date string only if it represents a real date (year ≥ 1900). */
function validDate(d?: string): string | null {
  if (!d) return null;
  const year = parseInt(d.split('-')[0], 10);
  if (!year || year < 1900) return null;
  return d.split('T')[0];
}
import { CDESet, CDEElement, getStatusName, getElementType } from '../types/cde';
import { StatusBadge } from '../components/cde/StatusBadge';
import { Button } from '../components/ui/Button';
import { MODALITY_COLORS, SPECIALTY_COLORS } from '../data/mockData';
import { clsx } from 'clsx';
import { useAuthStore } from '../store/authStore';
import { useReviewStore } from '../store/reviewStore';
import { useDraftsStore } from '../store/draftsStore';

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  value_set: { label: 'Value Set', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
  integer: { label: 'Integer', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  float: { label: 'Float', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
};

function ElementRow({ element, setId, isDraft = false }: { element: CDEElement; setId: string; isDraft?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const type = getElementType(element);
  const { label, color } = TYPE_LABELS[type];
  const { user } = useAuthStore();
  const { addComment, getElementComments } = useReviewStore();
  const [commentText, setCommentText] = useState('');
  const [showComment, setShowComment] = useState(false);
  const comments = getElementComments(setId, element.id);

  const handleAddComment = () => {
    if (!user || !commentText.trim()) return;
    addComment({ setId, userId: user.id, userName: user.name, userRole: user.role, content: commentText.trim(), elementId: element.id });
    setCommentText('');
    setShowComment(false);
  };

  return (
    <div className="border border-slate-200 rounded-xl dark:border-slate-700 overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-start gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-slate-400 dark:text-slate-500">{element.id}</span>
            <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', color)}>{label}</span>
            {comments.length > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                <MessageSquare size={10} /> {comments.length}
              </span>
            )}
          </div>
          <p className="mt-1 font-semibold text-slate-900 dark:text-white">{element.name}</p>
          {!expanded && element.definition && (
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{element.definition}</p>
          )}
        </div>
        {expanded ? <ChevronUp size={16} className="shrink-0 mt-1 text-slate-400" /> : <ChevronDown size={16} className="shrink-0 mt-1 text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700 space-y-4 pt-4">
          {element.definition && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Definition</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{element.definition}</p>
            </div>
          )}
          {element.question && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Question</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{element.question}</p>
            </div>
          )}

          {/* Value Set */}
          {element.value_set && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Allowed Values
                <span className="ml-2 font-normal normal-case">
                  (min: {element.value_set.min_cardinality}, max: {element.value_set.max_cardinality})
                </span>
              </p>
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-700/50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">Code</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">Value</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">Definition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {element.value_set.values.map((v, i) => (
                      <tr key={i} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="px-3 py-2 font-mono text-xs text-slate-500 dark:text-slate-400">{v.code || '—'}</td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-600 dark:text-slate-400">{v.value}</td>
                        <td className="px-3 py-2 text-slate-900 dark:text-white font-medium">{v.name}</td>
                        <td className="px-3 py-2 text-slate-500 dark:text-slate-400 text-xs">{v.definition || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Integer/Float values */}
          {element.integer_value && (
            <div className="flex gap-4 text-sm">
              <span><span className="text-slate-400">Min:</span> <strong className="text-slate-900 dark:text-white">{element.integer_value.min ?? '—'}</strong></span>
              <span><span className="text-slate-400">Max:</span> <strong className="text-slate-900 dark:text-white">{element.integer_value.max ?? '—'}</strong></span>
              {element.integer_value.step && <span><span className="text-slate-400">Step:</span> <strong className="text-slate-900 dark:text-white">{element.integer_value.step}</strong></span>}
              {element.integer_value.unit && <span><span className="text-slate-400">Unit:</span> <strong className="text-slate-900 dark:text-white">{element.integer_value.unit}</strong></span>}
            </div>
          )}
          {element.float_value && (
            <div className="flex gap-4 text-sm">
              <span><span className="text-slate-400">Min:</span> <strong className="text-slate-900 dark:text-white">{element.float_value.min ?? '—'}</strong></span>
              <span><span className="text-slate-400">Max:</span> <strong className="text-slate-900 dark:text-white">{element.float_value.max ?? '—'}</strong></span>
              {element.float_value.step && <span><span className="text-slate-400">Step:</span> <strong className="text-slate-900 dark:text-white">{element.float_value.step}</strong></span>}
              {element.float_value.unit && <span><span className="text-slate-400">Unit:</span> <strong className="text-slate-900 dark:text-white">{element.float_value.unit}</strong></span>}
            </div>
          )}

          {/* Index codes */}
          {element.index_codes && element.index_codes.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Ontology Codes</p>
              <div className="flex flex-wrap gap-2">
                {element.index_codes.map((c, i) => (
                  <a key={i} href={c.url || c.href} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600 hover:border-brand-400 hover:text-brand-600 dark:border-slate-600 dark:text-slate-400 transition-colors">
                    <span className="font-semibold">{c.system}</span>
                    <span className="text-slate-400">·</span>
                    <span>{c.code}</span>
                    <span className="text-slate-400">—</span>
                    <span>{c.display}</span>
                    {(c.url || c.href) && <ExternalLink size={10} className="ml-0.5" />}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Comments for this element */}
          {comments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Comments</p>
              {comments.map(c => (
                <div key={c.id} className="rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/10 dark:border-amber-800 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{c.userName}</span>
                    <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                    {c.resolved && <CheckCircle size={12} className="text-emerald-500" />}
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{c.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add comment */}
          {user && !showComment && (
            <button
              onClick={() => setShowComment(true)}
              className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 transition-colors"
            >
              <MessageSquare size={12} /> Add comment on this element
            </button>
          )}
          {user && showComment && (
            <div className="space-y-2">
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Enter your comment or review note…"
                rows={3}
                className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddComment} disabled={!commentText.trim()}>Post comment</Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowComment(false); setCommentText(''); }}>Cancel</Button>
              </div>
            </div>
          )}

          {!isDraft && (
            <Link to={`/elements/${element.id}`} className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 transition-colors">
              View element detail <ExternalLink size={12} />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export function SetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [set, setSet] = useState<CDESet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'elements' | 'metadata' | 'comments'>('elements');
  const [commentText, setCommentText] = useState('');

  const { user } = useAuthStore();
  const { addComment, getSetComments } = useReviewStore();
  const { createDraft, drafts } = useDraftsStore();
  const setComments = id ? getSetComments(id) : [];

  // Check store first — covers both TBD pattern IDs and any edge-case IDs
  const localDraft = id ? drafts.find(d => d.set.id === id) : undefined;
  const isLocalDraft = !!(localDraft || id?.includes('TO_BE_DETERMINED'));

  useEffect(() => {
    if (!id) return;
    // Serve local drafts from Zustand store — never hit the API for them
    if (isLocalDraft) {
      if (localDraft) {
        setSet(localDraft.set);
      } else {
        setError('Draft not found in local store');
      }
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchSetById(id)
      .then(data => setSet(data as CDESet))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isLocalDraft, localDraft]);

  const handleDownload = () => {
    if (!set) return;
    const blob = new Blob([JSON.stringify(set, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${set.id}.cdes.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleForkAsNew = () => {
    if (!set || !user) return;
    const draft = createDraft(user.id, user.name, {
      name: `${set.name} (draft)`,
      description: set.description,
      specialties: set.specialties,
      modalities: set.modalities,
      body_parts: set.body_parts,
      elements: set.elements,
    });
    navigate(`/editor/${draft.id}`);
  };

  const handleAddComment = () => {
    if (!user || !commentText.trim() || !id) return;
    addComment({ setId: id, userId: user.id, userName: user.name, userRole: user.role, content: commentText.trim() });
    setCommentText('');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 rounded-lg bg-slate-200 animate-pulse dark:bg-slate-700" />
        <div className="h-48 rounded-xl bg-slate-200 animate-pulse dark:bg-slate-700" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 rounded-xl bg-slate-200 animate-pulse dark:bg-slate-700" />)}
        </div>
      </div>
    );
  }

  if (error || !set) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/20">
        <p className="text-red-600 dark:text-red-400">{error || 'Set not found'}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/sets')}>
          <ArrowLeft size={14} /> Back to Sets
        </Button>
      </div>
    );
  }

  const statusName = getStatusName(set.status);
  const contributors = set.contributors;
  const specialties = set.specialties || [];
  const modalities = set.modalities || [];
  const bodyParts = set.body_parts || [];
  const indexCodes = set.index_codes || [];

  return (
    <div className="space-y-6">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Header card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="font-mono text-sm font-semibold text-slate-400 dark:text-slate-500">{set.id}</span>
              <StatusBadge status={statusName} size="md" />
              {modalities.map(m => (
                <span key={m} className={clsx('rounded-md px-2 py-0.5 text-xs font-semibold', MODALITY_COLORS[m] || 'bg-slate-100 text-slate-600')}>
                  {m}
                </span>
              ))}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{set.name}</h1>
            {set.description && (
              <p className="mt-2 text-slate-600 dark:text-slate-400 leading-relaxed">{set.description}</p>
            )}

            {/* Specialties */}
            {specialties.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {specialties.map(sp => (
                  <span key={sp.abbreviation} className={clsx(
                    'rounded-full px-2.5 py-0.5 text-xs font-medium',
                    SPECIALTY_COLORS[sp.abbreviation] || 'bg-slate-100 text-slate-600'
                  )}>
                    {sp.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            <Button onClick={handleDownload} variant="outline" size="sm">
              <Download size={14} /> Download JSON
            </Button>
            {user && (user.role === 'author' || user.role === 'admin') && (
              <Button onClick={handleForkAsNew} size="sm">
                <Edit size={14} /> Fork as New Draft
              </Button>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-700 flex gap-6 text-sm text-slate-600 dark:text-slate-400 flex-wrap">
          <span><strong className="text-slate-900 dark:text-white">{set.elements.length}</strong> elements</span>
          {set.set_version && (
            <span>
              <strong className="text-slate-900 dark:text-white">v{set.set_version.number}</strong>
              {validDate(set.set_version.date) && ` (${validDate(set.set_version.date)})`}
            </span>
          )}
          {set.schema_version && <span>Schema {set.schema_version}</span>}
          {bodyParts.length > 0 && <span>{bodyParts.map(b => b.name).join(', ')}</span>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {(['elements', 'metadata', 'comments'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-colors',
              activeTab === tab
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            )}
          >
            {tab} {tab === 'elements' && `(${set.elements.length})`}
            {tab === 'comments' && setComments.length > 0 && ` (${setComments.length})`}
          </button>
        ))}
      </div>

      {/* Draft notice banner */}
      {isLocalDraft && localDraft && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20 flex items-center gap-3">
          <div className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            localDraft.submittedForReview
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
          }`}>
            {localDraft.submittedForReview ? 'Under Review' : 'Draft'}
          </div>
          <p className="text-sm text-amber-800 dark:text-amber-300">
            This is a local draft authored by <strong>{localDraft.authorName}</strong>.
            {localDraft.submittedForReview
              ? ' It has been submitted for community review.'
              : ' It has not yet been submitted for review.'}
          </p>
        </div>
      )}

      {/* Elements tab */}
      {activeTab === 'elements' && (
        <div className="space-y-3">
          {set.elements.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800">
              <p className="text-slate-500 dark:text-slate-400">No elements defined yet.</p>
            </div>
          ) : (
            set.elements.map(el => (
              <ElementRow key={el.id} element={el} setId={set.id} isDraft={isLocalDraft} />
            ))
          )}
        </div>
      )}

      {/* Metadata tab */}
      {activeTab === 'metadata' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Contributors */}
          {contributors && ((contributors.people?.length ?? 0) > 0 || (contributors.organizations?.length ?? 0) > 0) && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                <User size={16} /> Contributors
              </h3>
              <div className="space-y-2">
                {contributors.people?.map((p, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-medium text-slate-900 dark:text-white">{p.name}</span>
                    {p.role && <span className="ml-1.5 text-xs text-slate-400 capitalize">({p.role})</span>}
                    {p.email && <span className="block text-xs text-slate-500 dark:text-slate-400">{p.email}</span>}
                    {p.orcid_id && <span className="block text-xs text-slate-400 font-mono">ORCID: {p.orcid_id}</span>}
                  </div>
                ))}
                {contributors.organizations?.map((o, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Building2 size={14} className="text-slate-400" />
                    <span className="text-slate-900 dark:text-white">{o.name}</span>
                    {o.abbreviation && <span className="text-slate-400">({o.abbreviation})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Index codes */}
          {indexCodes.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                <Hash size={16} /> Ontology Codes
              </h3>
              <div className="space-y-2">
                {indexCodes.map((c, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">{c.system}</span>
                    <span className="mx-1.5 text-slate-300">·</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{c.code}</span>
                    <span className="mx-1.5 text-slate-300">—</span>
                    <span className="text-slate-600 dark:text-slate-400">{c.display}</span>
                    {(c.url || c.href) && (
                      <a href={c.url || c.href} target="_blank" rel="noopener noreferrer"
                        className="ml-1.5 text-brand-500 hover:text-brand-600 dark:text-brand-400">
                        <ExternalLink size={11} className="inline" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Version history */}
          {set.history && set.history.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                <Calendar size={16} /> History
              </h3>
              <div className="space-y-2">
                {set.history.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <StatusBadge status={h.status} />
                    <span className="text-slate-500 dark:text-slate-400">{h.date?.split('T')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* External URL */}
          {set.url && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                <Globe size={16} /> External Link
              </h3>
              <a href={set.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400">
                {set.url} <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Comments tab */}
      {activeTab === 'comments' && (
        <div className="space-y-4">
          {setComments.filter(c => !c.elementId).length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-800">
              <MessageSquare size={24} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-slate-500 dark:text-slate-400">No general comments yet.</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                Expand individual elements to comment on specific parts.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {setComments.filter(c => !c.elementId).map(c => (
                <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 text-xs font-semibold shrink-0">
                      {c.userName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{c.userName}</span>
                        <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                        {c.resolved && (
                          <span className="flex items-center gap-1 text-xs text-emerald-600">
                            <CheckCircle size={12} /> Resolved
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{c.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {user ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-sm font-medium text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <Plus size={14} /> Add a general comment
              </p>
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Share your review notes, suggestions, or questions about this CDE set…"
                rows={4}
                className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white resize-y"
              />
              <div className="mt-2 flex gap-2">
                <Button onClick={handleAddComment} disabled={!commentText.trim()} size="sm">
                  Post comment
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                <Link to="/login" className="text-brand-600 hover:text-brand-700 dark:text-brand-400">Sign in</Link> to add comments
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
