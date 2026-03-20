import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Users, FileEdit, MessageSquare, RefreshCw,
  ChevronDown, UserCheck, UserX, ClipboardList, ChevronLeft, ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { UserRole } from '../types/cde';
import { logAudit, AUDIT_ACTION_LABELS, AUDIT_ACTION_COLORS, AuditAction } from '../lib/auditLog';

interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization?: string;
  created_at: string;
  is_active: boolean | null;
  last_login_at: string | null;
  login_count: number | null;
}

interface DraftRow {
  id: string;
  author_name: string;
  name: string;
  submitted_for_review: boolean;
  promoted: boolean;
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

interface AuditRow {
  id: string;
  user_name: string;
  user_role: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  entity_name: string | null;
  details: Record<string, unknown> | null;
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

const AUDIT_PAGE_SIZE = 50;

const AUDIT_FILTER_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'user.login', label: 'Logins' },
  { value: 'user.role_change,user.deactivate,user.reactivate', label: 'User management' },
  { value: 'draft.create,draft.update,draft.delete', label: 'Draft edits' },
  { value: 'draft.submit_review,draft.retract_review', label: 'Review submissions' },
  { value: 'draft.promote', label: 'Promotions' },
];

export function AdminPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'drafts' | 'reviews' | 'audit'>('users');

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [auditLog, setAuditLog] = useState<AuditRow[]>([]);

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);
  const [activeToggling, setActiveToggling] = useState<string | null>(null);

  const [auditFilter, setAuditFilter] = useState('');
  const [auditPage, setAuditPage] = useState(0);
  const [auditTotal, setAuditTotal] = useState(0);

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
      .select('id, author_name, name, submitted_for_review, promoted, created_at, updated_at, set_data')
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

  async function fetchAuditLog(page = auditPage, filter = auditFilter) {
    setLoadingAudit(true);
    const from = page * AUDIT_PAGE_SIZE;
    const to = from + AUDIT_PAGE_SIZE - 1;
    let query = supabase
      .from('audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
    if (filter) {
      const actions = filter.split(',');
      query = query.in('action', actions);
    }
    const { data, error, count } = await query;
    if (!error && data) {
      setAuditLog(data as AuditRow[]);
      setAuditTotal(count ?? 0);
    }
    setLoadingAudit(false);
  }

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
      fetchDrafts();
      fetchComments();
      fetchAuditLog(0, '');
    }
  }, [user]);

  async function handleRoleChange(profileId: string, newRole: UserRole, oldRole: UserRole) {
    setRoleUpdating(profileId);
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', profileId);
    if (!error) {
      const target = profiles.find(p => p.id === profileId);
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, role: newRole } : p));
      if (user && target) {
        logAudit({ userId: user.id, userName: user.name, userRole: user.role,
          action: 'user.role_change', entityType: 'user', entityId: profileId,
          entityName: target.name, details: { from: oldRole, to: newRole } });
      }
    } else {
      console.error('Role update failed:', error.message);
    }
    setRoleUpdating(null);
  }

  async function handleToggleActive(profileId: string, currentlyActive: boolean | null) {
    const isCurrentlyActive = currentlyActive !== false;
    setActiveToggling(profileId);
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !isCurrentlyActive })
      .eq('id', profileId);
    if (!error) {
      const target = profiles.find(p => p.id === profileId);
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, is_active: !isCurrentlyActive } : p));
      if (user && target) {
        logAudit({ userId: user.id, userName: user.name, userRole: user.role,
          action: isCurrentlyActive ? 'user.deactivate' : 'user.reactivate',
          entityType: 'user', entityId: profileId, entityName: target.name });
      }
    } else {
      console.error('Failed to toggle active state:', error.message);
    }
    setActiveToggling(null);
  }

  async function handleDeleteDraft(id: string, name: string) {
    await supabase.from('drafts').delete().eq('id', id);
    setDrafts(prev => prev.filter(d => d.id !== id));
    if (user) {
      logAudit({ userId: user.id, userName: user.name, userRole: user.role,
        action: 'draft.delete', entityType: 'draft', entityId: id, entityName: name });
    }
  }

  if (!user || user.role !== 'admin') return null;

  const auditPageCount = Math.ceil(auditTotal / AUDIT_PAGE_SIZE);

  const tabs = [
    { id: 'users'   as const, label: 'Users',     icon: <Users size={16} />,        count: profiles.length },
    { id: 'drafts'  as const, label: 'Drafts',    icon: <FileEdit size={16} />,      count: drafts.length },
    { id: 'reviews' as const, label: 'Comments',  icon: <MessageSquare size={16} />, count: comments.length },
    { id: 'audit'   as const, label: 'Audit Log', icon: <ClipboardList size={16} />, count: auditTotal },
  ];

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={20} className="text-rose-500" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Panel</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage users, drafts, review activity, and audit history.
          </p>
        </div>
        <button
          onClick={() => { fetchUsers(); fetchDrafts(); fetchComments(); fetchAuditLog(auditPage, auditFilter); }}
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

      {/* ── Users tab ── */}
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
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{h}</th>
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
                        <span className="ml-2 text-xs text-red-500 font-normal" style={{textDecoration:'none'}}>deactivated</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{profile.email}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                      {profile.organization || <span className="italic text-slate-300 dark:text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative inline-flex items-center gap-1">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[profile.role]}`}>{profile.role}</span>
                        <div className="relative ml-1">
                          <select
                            value={profile.role}
                            disabled={roleUpdating === profile.id || profile.id === user.id}
                            onChange={e => handleRoleChange(profile.id, e.target.value as UserRole, profile.role)}
                            className="appearance-none cursor-pointer rounded border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-600 hover:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                          <ChevronDown size={10} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                        {roleUpdating === profile.id && <span className="text-xs text-slate-400">Saving…</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{new Date(profile.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {profile.last_login_at
                        ? new Date(profile.last_login_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
                        : <span className="italic text-slate-300 dark:text-slate-600">Never</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs text-center">{profile.login_count ?? 0}</td>
                    <td className="px-4 py-3">
                      {profile.id !== user.id && (
                        <button
                          onClick={() => handleToggleActive(profile.id, profile.is_active)}
                          disabled={activeToggling === profile.id}
                          title={profile.is_active !== false ? 'Deactivate account' : 'Reactivate account'}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                            profile.is_active !== false
                              ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-teal-50 text-teal-600 hover:bg-teal-100 dark:bg-teal-900/20 dark:text-teal-400'
                          }`}
                        >
                          {profile.is_active !== false ? <><UserX size={12} /> Deactivate</> : <><UserCheck size={12} /> Reactivate</>}
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

      {/* ── Drafts tab ── */}
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
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{h}</th>
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
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{draft.set_data?.elements?.length ?? 0}</td>
                    <td className="px-4 py-3">
                      {draft.promoted ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Proposed</span>
                      ) : draft.submitted_for_review ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">In Review</span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">Draft</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(draft.updated_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { if (confirm(`Delete "${draft.name || 'Untitled'}"? This cannot be undone.`)) handleDeleteDraft(draft.id, draft.name); }}
                        className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 font-medium"
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

      {/* ── Comments tab ── */}
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
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {comments.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{c.user_name}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[c.user_role as UserRole] ?? ''}`}>{c.user_role}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{c.set_id}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">{c.content}</td>
                    <td className="px-4 py-3">
                      {c.resolved
                        ? <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">Resolved</span>
                        : <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Open</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Audit Log tab ── */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <select
                value={auditFilter}
                onChange={e => { setAuditFilter(e.target.value); setAuditPage(0); fetchAuditLog(0, e.target.value); }}
                className="appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {AUDIT_FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <span className="text-sm text-slate-400">{auditTotal.toLocaleString()} events</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
            {loadingAudit ? (
              <div className="p-8 text-center text-slate-400">Loading audit log…</div>
            ) : auditLog.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No events recorded yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    {['When', 'User', 'Role', 'Action', 'Target', 'Detail'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {auditLog.map(row => {
                    const actionKey = row.action as AuditAction;
                    const label = AUDIT_ACTION_LABELS[actionKey] ?? row.action;
                    const color = AUDIT_ACTION_COLORS[actionKey] ?? 'bg-slate-100 text-slate-600';
                    const detail = row.details ? Object.entries(row.details).map(([k, v]) => `${k}: ${v}`).join(', ') : null;
                    return (
                      <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                          {new Date(row.created_at).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white text-xs">
                          {row.user_name || <span className="italic text-slate-400">Unknown</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[row.user_role as UserRole] ?? 'bg-slate-100 text-slate-500'}`}>
                            {row.user_role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{label}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 max-w-[180px] truncate">
                          {row.entity_name || row.entity_id || <span className="italic text-slate-300 dark:text-slate-600">—</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 max-w-[160px] truncate">
                          {detail || <span className="italic text-slate-300 dark:text-slate-600">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {auditPageCount > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Page {auditPage + 1} of {auditPageCount}</span>
              <div className="flex gap-2">
                <button
                  disabled={auditPage === 0}
                  onClick={() => { const p = auditPage - 1; setAuditPage(p); fetchAuditLog(p, auditFilter); }}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <button
                  disabled={auditPage >= auditPageCount - 1}
                  onClick={() => { const p = auditPage + 1; setAuditPage(p); fetchAuditLog(p, auditFilter); }}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  Next <ChevronRightIcon size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
