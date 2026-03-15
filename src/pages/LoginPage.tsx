import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, UserCheck, Shield, BookOpen } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Input, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { UserRole } from '../types/cde';

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<'login' | 'register'>(
    searchParams.get('tab') === 'register' ? 'register' : 'login'
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('author');

  const { login, register, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!regName.trim()) { setError('Name is required'); return; }
    if (!regEmail.trim()) { setError('Email is required'); return; }
    if (regPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(regName, regEmail, regPassword, regRole);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: string) => {
    setTab('login');
    setLoginEmail(`${role}@radiology.org`);
    setLoginPassword('demo');
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white text-xl font-bold mb-4">
            RE
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {tab === 'login' ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {tab === 'login'
              ? 'Sign in to author and review CDE sets'
              : 'Join the RadElement authoring community'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-6 dark:bg-slate-800">
          <button
            onClick={() => { setTab('login'); setError(null); }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === 'login'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('register'); setError(null); }}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === 'register'
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
            }`}
          >
            Register
          </button>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                required
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <Button type="submit" loading={loading} className="w-full">
                Sign In
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <Input
                label="Full name"
                value={regName}
                onChange={e => setRegName(e.target.value)}
                placeholder="Dr. Jane Smith"
                required
              />
              <Input
                label="Email"
                type="email"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                placeholder="your@institution.edu"
                required
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <Select
                label="Role"
                value={regRole}
                onChange={e => setRegRole(e.target.value as UserRole)}
              >
                <option value="author">Author — Create and edit CDE sets</option>
                <option value="reviewer">Reviewer — Review and comment on CDEs</option>
                <option value="viewer">Viewer — Browse only</option>
              </Select>
              <Button type="submit" loading={loading} className="w-full">
                Create Account
              </Button>
            </form>
          )}
        </div>

        {/* Demo accounts */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Demo Accounts (password: demo)
          </p>
          <div className="space-y-2">
            {[
              { email: 'author', role: 'Author', icon: <BookOpen size={14} />, desc: 'Create and edit CDE sets' },
              { email: 'reviewer', role: 'Reviewer', icon: <Shield size={14} />, desc: 'Review and comment on CDEs' },
              { email: 'admin', role: 'Admin', icon: <UserCheck size={14} />, desc: 'Full access' },
            ].map(d => (
              <button
                key={d.email}
                onClick={() => fillDemo(d.email)}
                className="flex items-center gap-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm hover:border-brand-400 hover:bg-brand-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:hover:border-brand-600 dark:hover:bg-brand-900/20"
              >
                <span className="text-brand-600 dark:text-brand-400">{d.icon}</span>
                <div>
                  <span className="font-medium text-slate-900 dark:text-white">{d.role}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{d.desc}</span>
                </div>
                <span className="ml-auto font-mono text-xs text-slate-400">{d.email}@radiology.org</span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4">
          This is a demonstration platform. Accounts are stored locally in your browser.
        </p>
      </div>
    </div>
  );
}
