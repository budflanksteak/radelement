import { create } from 'zustand';
import { User, UserRole } from '../types/cde';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialize: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

async function fetchProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    email: data.email ?? '',
    name: data.name ?? '',
    role: (data.role as UserRole) ?? 'viewer',
    organization: data.organization ?? undefined,
    orcid_id: data.orcid_id ?? undefined,
  };
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  loading: true,

  initialize: () => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        set({ user: profile, loading: false });
      } else {
        set({ user: null, loading: false });
      }
    });

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        set({ user: profile, loading: false });
      } else {
        set({ user: null, loading: false });
      }
    });
  },

  login: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  },

  register: async (name, email, password) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw new Error(error.message);
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },

  updateProfile: async (updates) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    const { error } = await supabase
      .from('profiles')
      .update({
        name: updates.name,
        organization: updates.organization,
        orcid_id: updates.orcid_id,
      })
      .eq('id', authUser.id);
    if (error) throw new Error(error.message);
    set(state => ({ user: state.user ? { ...state.user, ...updates } : null }));
  },
}));
