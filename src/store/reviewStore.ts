import { create } from 'zustand';
import { Comment, UserRole } from '../types/cde';
import { supabase } from '../lib/supabase';

interface ReviewState {
  comments: Comment[];
  loading: boolean;
  loadComments: (setId: string) => Promise<void>;
  loadAllComments: () => Promise<void>;
  addComment: (params: {
    setId: string;
    userId: string;
    userName: string;
    userRole: UserRole;
    content: string;
    elementId?: string;
  }) => void;
  updateComment: (id: string, content: string) => void;
  deleteComment: (id: string) => void;
  resolveComment: (id: string) => void;
  getSetComments: (setId: string) => Comment[];
  getElementComments: (setId: string, elementId: string) => Comment[];
}

function rowToComment(row: Record<string, unknown>): Comment {
  return {
    id: row.id as string,
    setId: row.set_id as string,
    userId: row.user_id as string,
    userName: (row.user_name as string) ?? '',
    userRole: (row.user_role as UserRole) ?? 'viewer',
    content: row.content as string,
    elementId: (row.element_id as string) ?? undefined,
    resolved: (row.resolved as boolean) ?? false,
    createdAt: row.created_at as string,
    updatedAt: (row.updated_at as string) ?? undefined,
  };
}

export const useReviewStore = create<ReviewState>()((set, get) => ({
  comments: [],
  loading: false,

  loadComments: async (setId) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('set_id', setId)
      .order('created_at', { ascending: true });
    if (!error && data) {
      const incoming = data.map(rowToComment);
      set(state => {
        // Merge: keep comments for other sets, replace for this setId
        const others = state.comments.filter(c => c.setId !== setId);
        return { comments: [...others, ...incoming], loading: false };
      });
    } else {
      set({ loading: false });
    }
  },

  loadAllComments: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error && data) {
      set({ comments: data.map(rowToComment), loading: false });
    } else {
      set({ loading: false });
    }
  },

  addComment: ({ setId, userId, userName, userRole, content, elementId }) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const comment: Comment = {
      id: tempId,
      setId,
      userId,
      userName,
      userRole,
      content,
      elementId,
      createdAt: new Date().toISOString(),
      resolved: false,
    };
    // Optimistic local update
    set(state => ({ comments: [...state.comments, comment] }));
    // Persist to Supabase, swap temp ID for real UUID
    supabase.from('comments').insert({
      set_id: setId,
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      content,
      element_id: elementId ?? null,
      resolved: false,
    }).select().single().then(({ data, error }) => {
      if (error) {
        console.error('Failed to persist comment:', error.message);
        return;
      }
      if (data) {
        set(state => ({
          comments: state.comments.map(c =>
            c.id === tempId ? rowToComment(data as unknown as Record<string, unknown>) : c
          ),
        }));
      }
    });
  },

  updateComment: (id, content) => {
    const ts = new Date().toISOString();
    set(state => ({
      comments: state.comments.map(c =>
        c.id === id ? { ...c, content, updatedAt: ts } : c
      ),
    }));
    supabase.from('comments').update({ content, updated_at: ts })
      .eq('id', id).then(({ error }) => {
        if (error) console.error('Failed to update comment:', error.message);
      });
  },

  deleteComment: (id) => {
    set(state => ({ comments: state.comments.filter(c => c.id !== id) }));
    supabase.from('comments').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('Failed to delete comment:', error.message);
    });
  },

  resolveComment: (id) => {
    const ts = new Date().toISOString();
    set(state => ({
      comments: state.comments.map(c =>
        c.id === id ? { ...c, resolved: true, updatedAt: ts } : c
      ),
    }));
    supabase.from('comments').update({ resolved: true, updated_at: ts })
      .eq('id', id).then(({ error }) => {
        if (error) console.error('Failed to resolve comment:', error.message);
      });
  },

  getSetComments: (setId) => get().comments.filter(c => c.setId === setId),

  getElementComments: (setId, elementId) =>
    get().comments.filter(c => c.setId === setId && c.elementId === elementId),
}));
