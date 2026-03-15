import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '../types/cde';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

// Demo users for development/testing
const DEMO_USERS: (User & { password: string })[] = [
  {
    id: 'user-1',
    email: 'author@radiology.org',
    password: 'demo',
    name: 'Dr. Sarah Chen',
    role: 'author',
    orcid_id: '0000-0001-2345-6789',
    organization: 'Johns Hopkins Radiology',
  },
  {
    id: 'user-2',
    email: 'reviewer@radiology.org',
    password: 'demo',
    name: 'Dr. Michael Flanders',
    role: 'reviewer',
    organization: 'ACR Commission on Informatics',
  },
  {
    id: 'user-3',
    email: 'admin@radiology.org',
    password: 'demo',
    name: 'RadElement Admin',
    role: 'admin',
    organization: 'RSNA',
  },
];

const STORED_USERS_KEY = 'radelement_users';

function getStoredUsers(): (User & { password: string })[] {
  try {
    const raw = localStorage.getItem(STORED_USERS_KEY);
    if (raw) return [...DEMO_USERS, ...JSON.parse(raw)];
  } catch { /* ignore */ }
  return DEMO_USERS;
}

function saveNewUser(user: User & { password: string }) {
  try {
    const raw = localStorage.getItem(STORED_USERS_KEY);
    const existing: (User & { password: string })[] = raw ? JSON.parse(raw) : [];
    existing.push(user);
    localStorage.setItem(STORED_USERS_KEY, JSON.stringify(existing));
  } catch { /* ignore */ }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      login: async (email, password) => {
        const users = getStoredUsers();
        const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        if (!found) throw new Error('Invalid email or password');
        const { password: _pw, ...user } = found;
        const token = `demo-token-${user.id}-${Date.now()}`;
        set({ user, token });
      },

      register: async (name, email, password, role) => {
        const users = getStoredUsers();
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
          throw new Error('An account with this email already exists');
        }
        const newUser: User & { password: string } = {
          id: `user-${Date.now()}`,
          email,
          password,
          name,
          role,
        };
        saveNewUser(newUser);
        const { password: _pw, ...user } = newUser;
        const token = `demo-token-${user.id}-${Date.now()}`;
        set({ user, token });
      },

      logout: () => set({ user: null, token: null }),

      updateProfile: (updates) => set(state => ({
        user: state.user ? { ...state.user, ...updates } : null
      })),
    }),
    {
      name: 'radelement-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
