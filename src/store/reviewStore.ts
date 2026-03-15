import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Comment, UserRole } from '../types/cde';

interface ReviewState {
  comments: Comment[];
  addComment: (params: { setId: string; userId: string; userName: string; userRole: UserRole; content: string; elementId?: string }) => void;
  updateComment: (id: string, content: string) => void;
  deleteComment: (id: string) => void;
  resolveComment: (id: string) => void;
  getSetComments: (setId: string) => Comment[];
  getElementComments: (setId: string, elementId: string) => Comment[];
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      comments: [],

      addComment: ({ setId, userId, userName, userRole, content, elementId }) => {
        const comment: Comment = {
          id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          setId,
          userId,
          userName,
          userRole,
          content,
          elementId,
          createdAt: new Date().toISOString(),
          resolved: false,
        };
        set(state => ({ comments: [...state.comments, comment] }));
      },

      updateComment: (id, content) => {
        set(state => ({
          comments: state.comments.map(c =>
            c.id === id ? { ...c, content, updatedAt: new Date().toISOString() } : c
          )
        }));
      },

      deleteComment: (id) => {
        set(state => ({ comments: state.comments.filter(c => c.id !== id) }));
      },

      resolveComment: (id) => {
        set(state => ({
          comments: state.comments.map(c => c.id === id ? { ...c, resolved: true } : c)
        }));
      },

      getSetComments: (setId) => get().comments.filter(c => c.setId === setId),

      getElementComments: (setId, elementId) =>
        get().comments.filter(c => c.setId === setId && c.elementId === elementId),
    }),
    { name: 'radelement-reviews' }
  )
);
