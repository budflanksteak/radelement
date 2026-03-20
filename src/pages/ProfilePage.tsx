import { useState } from 'react';
import { User, Mail, Building2, Save, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const ORCID_RE = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

function formatOrcid(raw: string): string {
  const clean = raw.replace(/[^0-9Xx]/g, '').toUpperCase().slice(0, 16);
  return clean.replace(/(.{4})(?=.)/g, '$1-');
}

function orcidValid(val: string): boolean {
  return ORCID_RE.test(val);
}

const ROLE_LABELS: Record<string, string> = {
  viewer: 'Viewer', author: 'Author', editor: 'Editor',
  reviewer: 'Reviewer', admin: 'Administrator',
};

const ROLE_COLORS: Record<string, string> = {
  viewer:   'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  author:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  editor:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  reviewer: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  admin:    'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
};

const OrcidLeaf = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 256 256" fill="currentColor" className="text-[#A6CE39]">
    <path d="M128 0C57.3 0 0 57.3 0 128s57.3 128 128 128 128-57.3 128-128S198.7 0 128 0zM86.3 186.2H70.9V79.1h15.4v107.1zm-7.7-122.1c-5.4 0-9.8-4.4-9.8-9.8s4.4-9.8 9.8-9.8 9.8 4.4 9.8 9.8-4.4 9.8-9.8 9.8zm133.2 122.1h-15.4v-52.3c0-12.4-.2-28.4-17.3-28.4-17.3 0-19.9 13.5-19.9 27.4v53.3h-15.4V79.1h14.8v14.6h.2c2.1-3.9 7.1-8 14.6-8 15.6 0 18.5 10.3 18.5 23.6v77.9z"/>
  </svg>
);

export function ProfilePage() {
  const { user, updateProfile } = useAuthStore();
  const [name, setName] = useState(user?.name ?? '');
  const [orcid, setOrcid] = useState(user?.orcid_id ?? '');
  const [organization, setOrganization] = useState(user?.organization ?? '');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <User size={48} className="text-slate-300 mb-4" />
        <p className="text-slate-500 dark:text-slate-400">Sign in to view your profile.</p>
      </div>
    );
  }

  const orcidTouched = orcid.length > 0;
  const orcidOk = orcidValid(orcid);
  const orcidError = orcidTouched && !orcidOk;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (orcidTouched && !orcidOk) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateProfile({ name, orcid_id: orcidOk ? orcid : undefined, organization });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save — please try again.');
    } finally {
      setSaving(false);
    }
  }

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
        <div className="flex-1 min-w-0">
          <p className="text-lg font-semibold text-slate-900 dark:text-white">{user.name}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[user.role] ?? ''}`}>
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
            {user.orcid_id && orcidValid(user.orcid_id) && (
              <a
                href={`https://orcid.org/${user.orcid_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#A6CE39] bg-[#A6CE39]/10 px-2.5 py-0.5 text-xs font-medium text-[#5E8A00] hover:bg-[#A6CE39]/20 transition-colors dark:text-[#A6CE39]"
              >
                <OrcidLeaf size={12} />
                {user.orcid_id}
                <ExternalLink size={10} />
              </a>
            )}
          </div>
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
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span className="inline-flex items-center gap-1.5"><Mail size={13} /> Email</span>
              </label>
              <input value={user.email} disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-400 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-500 cursor-not-allowed" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span className="inline-flex items-center gap-1.5"><Building2 size={13} /> Organization</span>
              </label>
              <input value={organization} onChange={e => setOrganization(e.target.value)}
                placeholder="e.g. Johns Hopkins Radiology"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white placeholder:text-slate-400" />
            </div>

            {/* ORCID */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                <span className="inline-flex items-center gap-1.5"><OrcidLeaf size={13} /> ORCID iD</span>
              </label>
              <div className="relative">
                <input
                  value={orcid}
                  onChange={e => setOrcid(formatOrcid(e.target.value))}
                  placeholder="0000-0000-0000-0000"
                  maxLength={19}
                  className={`w-full rounded-lg border px-3 py-2 pr-9 text-sm font-mono outline-none transition-colors placeholder:text-slate-400
                    ${orcidError
                      ? 'border-red-400 bg-red-50 text-red-900 focus:ring-2 focus:ring-red-400/20 dark:border-red-600 dark:bg-red-900/20 dark:text-red-200'
                      : orcidOk
                      ? 'border-[#A6CE39] bg-[#A6CE39]/5 text-slate-900 focus:ring-2 focus:ring-[#A6CE39]/30 dark:bg-[#A6CE39]/10 dark:text-white'
                      : 'border-slate-200 bg-white text-slate-900 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white'
                    }`}
                />
                {orcidOk  && <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A6CE39]" />}
                {orcidError && <AlertCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />}
              </div>
              {orcidError && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={11} /> Format must be 0000-0000-0000-0000 (16 digits; last may be X)
                </p>
              )}
              {!orcidError && (
                <p className="text-xs text-slate-400 mt-1">
                  Your ORCID iD links your research identity to published CDE contributions.{' '}
                  <a href="https://orcid.org/register" target="_blank" rel="noopener noreferrer"
                    className="text-brand-600 hover:underline dark:text-brand-400">
                    Get an ORCID iD →
                  </a>
                </p>
              )}
              {orcidOk && (
                <a href={`https://orcid.org/${orcid}`} target="_blank" rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-[#5E8A00] hover:underline dark:text-[#A6CE39]">
                  <ExternalLink size={11} /> View ORCID profile
                </a>
              )}
            </div>
          </div>
        </div>

        {saveError && (
          <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
          </div>
        )}

        <div className="px-6 py-4 flex items-center justify-between">
          {saved
            ? <p className="text-sm text-teal-600 dark:text-teal-400 font-medium flex items-center gap-1.5"><CheckCircle2 size={14} /> Saved successfully.</p>
            : <span />}
          <button type="submit" disabled={saving || (orcidTouched && !orcidOk)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            <Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
