import { useState } from 'react';
import { User, Mail, Building2, Link as LinkIcon, Save } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export function ProfilePage() {
  const { user, updateProfile } = useAuthStore();
  const [name, setName] = useState(user?.name ?? '');
  const [orcid, setOrcid] = useState(user?.orcid_id ?? '');
  const [organization, setOrganization] = useState(user?.organization ?? '');
  const [saved, setSaved] = useState(false);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <User size={48} className="text-slate-300 mb-4" />
        <p className="text-slate-500 dark:text-slate-400">Sign in to view your profile.</p>
      </div>
    );
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    updateProfile({ name, orcid_id: orcid, organization });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const ROLE_LABELS: Record<string, string> = {
    viewer: 'Viewer',
    author: 'Author',
    reviewer: 'Reviewer',
    admin: 'Administrator',
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your identity on the CDE platform.</p>
      </div>

      {/* Identity card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800 flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-brand-600 flex items-center justify-center text-white text-2xl font-bold select-none">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">{user.name}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
          <span className="mt-1 inline-block rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
            {ROLE_LABELS[user.role] ?? user.role}
          </span>
        </div>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave} className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
        <div className="p-6">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Edit Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span className="inline-flex items-center gap-1.5"><User size={13} /> Display Name</span>
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span className="inline-flex items-center gap-1.5"><Mail size={13} /> Email</span>
              </label>
              <input
                value={user.email}
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span className="inline-flex items-center gap-1.5"><Building2 size={13} /> Organization</span>
              </label>
              <input
                value={organization}
                onChange={e => setOrganization(e.target.value)}
                placeholder="e.g. Johns Hopkins Radiology"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span className="inline-flex items-center gap-1.5"><LinkIcon size={13} /> ORCID iD</span>
              </label>
              <input
                value={orcid}
                onChange={e => setOrcid(e.target.value)}
                placeholder="0000-0000-0000-0000"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white placeholder:text-slate-400"
              />
              <p className="text-xs text-slate-400 mt-1">Your ORCID iD will appear on published CDE contributions.</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 flex items-center justify-between">
          {saved && <p className="text-sm text-teal-600 dark:text-teal-400 font-medium">Saved successfully.</p>}
          {!saved && <span />}
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            <Save size={15} /> Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
