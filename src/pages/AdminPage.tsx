import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Users, FileEdit, MessageSquare, RefreshCw, ChevronDown, UserCheck, UserX } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { UserRole } from '../types/cde';

interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization?: string;
  created_at: string;
  is_active: boolean | null;     // null before migration = treat as true
  last_login_at: string | null;  // null = never logged in since tracking began
  login_count: number | null;    // null before migration = treat as 0
}

interface DraftRow {
  id: string;
  author_name: string;
  name: string;
  submitted_for_review: boolean;
  created_at: string;
  updated_at: string;
  set_data: { elements?: unknown[] };
}

interface CommentRow {
  id: string;
  set_id: string;
  user_name: string;
  user_role: string;
  content: string;
  resolved: boolean;
  created_at: string;
}

const ROLE_OPTIONS: UserRole[] = ['viewer', 'author', 'editor', 'reviewer', 'admin'];
const ROLE_COLORS: Record<UserRole, string> = {
  viewer:   'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  author:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  editor:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  reviewer: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  admin:    'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
};

export function AdminPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'drafts' | 'reviews'>('users');

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);
  const [activeToggling, setActiveToggling] = useState<string | null>(null);

  // Guard: redirect non-admins
  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/');
  }, [user, navigate]);

  async function fetchUsers() {
    setLoadingUsers(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setProfiles(data as Profile[]);
    setLoadingUsers(false);
  }

  async function fetchDrafts() {
    setLoadingDrafts(true);
    const { data, error } = await supabase
      .from('drafts')
      .select('id, author_name, name, submitted_for_review, created_at, updated_at, set_data')
      .order('updated_at', { ascending: false });
    if (!error && data) setDrafts(data as DraftRow[]);
    setLoadingDrafts(false);
  }

  async function fetchComments() {
    setLoadingComments(true);
    const { data, error } = await supabase
      .from('comments')
      .select('id, set_id, user_name, user_role, content, resolved, created_at')
      .order('created_at', { ascending: false });
    if (!error && data) setComments(data as CommentRow[]);
    setLoadingComments(false);
  }

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
      fetchDrafts();
      fetchComments();
    }
  }, [user]);

  async function handleRoleChange(profileId: string, newRole: UserRole) {
    setRoleUpdating(profileId);
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', profileId);
    if (!error) {
      setProfiles(prev =>
        prev.map(p => p.id === profileId ? { ...p, role: newRole } : p)
      );
    } else {
      console.error('Role update failed:', error.message);
    }
    setRoleUpdating(null);
  }

  async function handleToggleActive(profileId: string, currentlyActive: boolean | null) {
    // null means column doesn't exist yet or is true — treat as active
    const isCurrentlyActive = currentlyActive !== false;
    setActiveToggling(profileId);
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !isCurrentlyActive })
      .eq('id', profileId);
    if (!error) {
      setProfiles(prev =>
        prev.map(p => p.id === profileId ? { ...p, is_active: !isCurrentlyActive } : p)
      );
    } else {
      console.error('Failed to toggle active state:', error.message);
    }
    setActiveToggling(null);
  }

  async function handleDeleteDraft(id: string) {
    await supabase.from('drafts').delete().eq('id', id);
    setDrafts(prev => prev.filter(d => d.id !== id));
  }

  if (!user || user.role !== 'admin') return null;

  const tabs = [
    { id: 'users' as const, label: 'Users', icon: <Users size={16} />, count: profiles.length },
    { id: 'drafts' as const, label: 'Drafts', icon: <FileEdit size={16} />, count: drafts.length },
    { id: 'reviews' as const, label: 'Comments', icon: <MessageSquare size={16} />, count: comments.length },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={20} className="text-rose-500" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Panel</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage users, drafts, and review activity.
          </p>
        </div>
        <button
          onClick={() => { fetchUsers(); fetchDrafts(); fetchComments(); }}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 flex-1 justify-center rounded-lg py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-xs dark:bg-slate-600">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Users tab */}
      {activeTab === 'users' && (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
          {loadingUsers ? (
            <div className="p-8 text-center text-slate-400">Loading users…</div>
          ) : profiles.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No users yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  {['Name', 'Email', 'Organization', 'Role', 'Joined', 'Last Login', 'Logins', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {profiles.map(profile => (
                  <tr key={profile.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      <span className={profile.is_active === false ? 'line-through text-slate-400' : ''}>
                        {profile.name || <span className="text-slate-400 italic">—</span>}
                      </span>
                      {profile.is_active === false && (
                        <span className="ml-2 text-xs text-red-500 font-normal not-italic" style={{textDecoration:'none'}}>deactivated</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{profile.email}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {profile.organization || <span className="italic text-slate-300 dark:text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative inline-flex items-center gap-1">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[profile.role]}`}>
                          {profile.role}
                        </span>
                        <div className="relative ml-1">
                          <select
                            value={profile.role}
                            disabled={roleUpdating === profile.id || profile.id === user.id}
                            onChange={e => handleRoleChange(profile.id, e.target.value as UserRole)}
                            className="appearance-none cursor-pointer rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600 hover:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {ROLE_OPTIONS.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                          <ChevronDown size={10} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                        {roleUpdating === profile.id && (
                          <span className="text-xs text-slate-400">Saving…</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {profile.last_login_at
                        ? new Date(profile.last_login_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
                        : <span className="italic text-slate-300 dark:text-slate-600">Never</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs text-center">
                      {profile.login_count ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      {profile.id !== user.id && (
                        <button
                          onClick={() => handleToggleActive(profile.id, profile.is_active)}
                          disabled={activeToggling === profile.id}
                          title={profile.is_active !== false ? 'Deactivate account' : 'Reactivate account'}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                            profile.is_active !== false
                              ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40'
                              : 'bg-teal-50 text-teal-600 hover:bg-teal-100 dark:bg-teal-900/20 dark:text-teal-400 dark:hover:bg-teal-900/40'
                          }`}
                        >
                          {profile.is_active !== false
                            ? <><UserX size={12} /> Deactivate</>
                            : <><UserCheck size={12} /> Reactivate</>
                          }
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Drafts tab */}
      {activeTab === 'drafts' && (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
          {loadingDrafts ? (
            <div className="p-8 text-center text-slate-400">Loading drafts…</div>
          ) : drafts.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No drafts yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  {['Set Name', 'Author', 'Elements', 'Status', 'Updated', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {drafts.map(draft => (
                  <tr key={draft.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {draft.name || <span className="italic text-slate-400">Untitled</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{draft.author_name}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {draft.set_data?.elements?.length ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      {draft.submitted_for_review ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          In Review
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(draft.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${draft.name || 'Untitled'}"? This cannot be undone.`)) {
                            handleDeleteDraft(draft.id);
                          }
                        }}
                        className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Comments tab */}
      {activeTab === 'reviews' && (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
          {loadingComments ? (
            <div className="p-8 text-center text-slate-400">Loading comments…</div>
          ) : comments.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No review comments yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  {['Reviewer', 'Role', 'Set ID', 'Comment', 'Status', 'Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {comments.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{c.user_name}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[c.user_role as UserRole] ?? ''}`}>
                        {c.user_role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{c.set_id}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {c.content}
                    </td>
                    <td className="px-4 py-3">
                      {c.resolved ? (
                        <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                          Resolved
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                          Open
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
