import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Database, Layers, FileEdit, BookOpen,
  MessageSquare, X, Plus, User, ShieldCheck, ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../../store/authStore';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
  requiresAuth?: boolean;
  requiresRole?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/sets', icon: <Database size={18} />, label: 'CDE Sets' },
  { to: '/elements', icon: <Layers size={18} />, label: 'Elements' },
];

const AUTH_ITEMS: NavItem[] = [
  { to: '/drafts', icon: <FileEdit size={18} />, label: 'My Drafts', requiresRole: ['author', 'admin'] },
  { to: '/review', icon: <MessageSquare size={18} />, label: 'Review Queue', requiresRole: ['reviewer', 'admin'] },
  { to: '/admin', icon: <ShieldCheck size={18} />, label: 'Admin Panel', requiresRole: ['admin'] },
];

const RESOURCE_ITEMS = [
  { to: '/about', icon: <BookOpen size={18} />, label: 'About CDEs' },
];

function NavItem({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  return (
    <NavLink
      to={item.to}
      onClick={onClick}
      end={item.to === '/'}
      className={({ isActive }) => clsx(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors group',
        isActive
          ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white'
      )}
    >
      <span className="shrink-0">{item.icon}</span>
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
          {item.badge}
        </span>
      )}
    </NavLink>
  );
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const filteredAuthItems = AUTH_ITEMS.filter(item =>
    !item.requiresRole || (user && item.requiresRole.includes(user.role))
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-64 overflow-y-auto border-r border-slate-200 bg-white transition-transform dark:border-slate-700 dark:bg-slate-900',
        'lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Mobile close */}
        <div className="flex items-center justify-between p-4 lg:hidden">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">Navigation</span>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={16} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {/* Main nav */}
          {NAV_ITEMS.map(item => (
            <NavItem key={item.to} item={item} onClick={() => onClose()} />
          ))}

          {/* Separator */}
          {user && filteredAuthItems.length > 0 && (
            <>
              <div className="my-2 border-t border-slate-100 dark:border-slate-700" />
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Authoring
              </p>
              {filteredAuthItems.map(item => (
                <NavItem key={item.to} item={item} onClick={() => onClose()} />
              ))}
              {(user.role === 'author' || user.role === 'admin') && (
                <button
                  onClick={() => { navigate('/editor/new'); onClose(); }}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20 transition-colors"
                >
                  <Plus size={18} />
                  New CDE Set
                </button>
              )}
            </>
          )}

          <div className="my-2 border-t border-slate-100 dark:border-slate-700" />
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Resources
          </p>
          {RESOURCE_ITEMS.map(item => (
            <NavItem key={item.to} item={item} onClick={() => onClose()} />
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
          {user ? (
            <NavLink
              to="/profile"
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white text-xs font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.role}</p>
              </div>
              <ChevronRight size={14} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />
            </NavLink>
          ) : (
            <NavLink
              to="/login"
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20 transition-colors"
            >
              <User size={18} />
              Sign in to author
            </NavLink>
          )}
        </div>
      </aside>
    </>
  );
}
