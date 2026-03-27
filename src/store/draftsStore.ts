import { create } from 'zustand';
import { CDESet, CDEElement, Draft } from '../types/cde';
import { supabase } from '../lib/supabase';
import { logAudit } from '../lib/auditLog';
import { useAuthStore } from './authStore';

// Called at function-call time (not module load), so circular dep is safe
function getAuthUser() {
  return useAuthStore.getState().user;
}

interface DraftsState {
  drafts: Draft[];
  loading: boolean;
  loadDrafts: (userId: string, role: string) => Promise<void>;
  createDraft: (authorId: string, authorName: string, base?: Partial<CDESet>) => Draft;
  updateDraft: (id: string, set: CDESet) => void;
  deleteDraft: (id: string) => void;
  submitForReview: (id: string) => void;
  retractFromReview: (id: string) => void;
  promoteDraft: (id: string) => void;
  getDraft: (id: string) => Draft | undefined;
  getMyDrafts: (authorId: string) => Draft[];
  getAllDrafts: () => Draft[];
  addElement: (draftId: string, element: CDEElement) => void;
  updateElement: (draftId: string, elementId: string, element: CDEElement) => void;
  removeElement: (draftId: string, elementId: string) => void;
}

function newTBDId(prefix: 'RDES' | 'RDE'): string {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}TO_BE_DETERMINED${n}`;
}

function nowStr(): string {
  return new Date().toISOString();
}

function makeDefaultSet(): CDESet {
  return {
    id: newTBDId('RDES'),
    name: '',
    description: '',
    schema_version: '1.0.0',
    set_version: { number: 1, date: new Date().toISOString().split('T')[0] },
    status: { name: 'Proposed', date: new Date().toISOString().split('T')[0] },
    index_codes: [],
    body_parts: [],
    contributors: { people: [], organizations: [] },
    history: [{ date: new Date().toISOString().split('T')[0], status: 'Proposed' }],
    specialties: [],
    modalities: [],
    elements: [],
  };
}

function rowToDraft(row: Record<string, unknown>): Draft {
  return {
    id: row.id as string,
    authorId: row.author_id as string,
    authorName: (row.author_name as string) ?? '',
    set: (row.set_data as CDESet) ?? makeDefaultSet(),
    submittedForReview: (row.submitted_for_review as boolean) ?? false,
    promoted: (row.promoted as boolean) ?? false,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    reviewComments: [],
  };
}

export const useDraftsStore = create<DraftsState>()((set, get) => ({
  drafts: [],
  loading: false,

  loadDrafts: async (userId, role) => {
    set({ loading: true });
    try {
      let query = supabase.from('drafts').select('*');
      if (role === 'admin' || role === 'editor') {
        // admin and editor see all drafts
      } else if (role === 'reviewer') {
        query = query.or(`author_id.eq.${userId},submitted_for_review.eq.true`);
      } else {
        query = query.eq('author_id', userId);
      }
      const { data, error } = await query.order('updated_at', { ascending: false });
      if (error) throw error;
      set({ drafts: (data ?? []).map(rowToDraft), loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createDraft: (authorId, authorName, base = {}) => {
    // Auto-populate author as a contributor (with ORCID if available)
    const authUser = getAuthUser();
    const defaultSet = makeDefaultSet();
    const authorPerson = {
      name: authorName,
      role: 'Author',
      ...(authUser?.orcid_id ? { orcid_id: authUser.orcid_id } : {}),
    };
    const mergedContributors = {
      people: [authorPerson],
      organizations: [],
      ...(base.contributors ?? {}),
    };
    const draft: Draft = {
      id: crypto.randomUUID(),
      set: { ...defaultSet, ...base, contributors: mergedContributors } as CDESet,
      createdAt: nowStr(),
      updatedAt: nowStr(),
      authorId,
      authorName,
      submittedForReview: false,
      promoted: false,
      reviewComments: [],
    };
    // Optimistic local update
    set(state => ({ drafts: [draft, ...state.drafts] }));
    // Background Supabase insert
    supabase.from('drafts').insert({
      id: draft.id,
      author_id: authorId,
      author_name: authorName,
      name: draft.set.name || 'Untitled',
      set_data: draft.set,
      submitted_for_review: false,
      promoted: false,
    }).then(({ error }) => {
      if (error) console.error('Failed to persist draft:', error.message);
    });
    if (authUser) {
      logAudit({ userId: authUser.id, userName: authUser.name, userRole: authUser.role,
        action: 'draft.create', entityType: 'draft', entityId: draft.id,
        entityName: draft.set.name || 'Untitled' });
    }
    return draft;
  },

  updateDraft: (id, updatedSet) => {
    const ts = nowStr();
    set(state => ({
      drafts: state.drafts.map(d =>
        d.id === id ? { ...d, set: updatedSet, updatedAt: ts } : d
      ),
    }));
    supabase.from('drafts').update({
      set_data: updatedSet,
      name: updatedSet.name || 'Untitled',
      updated_at: ts,
    }).eq('id', id).then(({ error }) => {
      if (error) console.error('Failed to update draft:', error.message);
    });
  },

  deleteDraft: (id) => {
    const draft = get().drafts.find(d => d.id === id);
    set(state => ({ drafts: state.drafts.filter(d => d.id !== id) }));
    supabase.from('drafts').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('Failed to delete draft:', error.message);
    });
    const u = getAuthUser();
    if (u) logAudit({ userId: u.id, userName: u.name, userRole: u.role,
      action: 'draft.delete', entityType: 'draft', entityId: id,
      entityName: draft?.set.name || 'Untitled' });
  },

  submitForReview: (id) => {
    const ts = nowStr();
    const draft = get().drafts.find(d => d.id === id);
    set(state => ({
      drafts: state.drafts.map(d =>
        d.id === id ? { ...d, submittedForReview: true, updatedAt: ts } : d
      ),
    }));
    supabase.from('drafts').update({ submitted_for_review: true, updated_at: ts })
      .eq('id', id).then(({ error }) => {
        if (error) console.error('Failed to submit for review:', error.message);
      });
    const u = getAuthUser();
    if (u) logAudit({ userId: u.id, userName: u.name, userRole: u.role,
      action: 'draft.submit_review', entityType: 'draft', entityId: id,
      entityName: draft?.set.name || 'Untitled' });
  },

  retractFromReview: (id) => {
    const ts = nowStr();
    const draft = get().drafts.find(d => d.id === id);
    set(state => ({
      drafts: state.drafts.map(d =>
        d.id === id ? { ...d, submittedForReview: false, updatedAt: ts } : d
      ),
    }));
    supabase.from('drafts').update({ submitted_for_review: false, updated_at: ts })
      .eq('id', id).then(({ error }) => {
        if (error) console.error('Failed to retract draft:', error.message);
      });
    const u = getAuthUser();
    if (u) logAudit({ userId: u.id, userName: u.name, userRole: u.role,
      action: 'draft.retract_review', entityType: 'draft', entityId: id,
      entityName: draft?.set.name || 'Untitled' });
  },

  promoteDraft: (id) => {
    const ts = nowStr();
    const draft = get().drafts.find(d => d.id === id);
    set(state => ({
      drafts: state.drafts.map(d =>
        d.id === id ? { ...d, promoted: true, updatedAt: ts } : d
      ),
    }));
    supabase.from('drafts').update({ promoted: true, updated_at: ts })
      .eq('id', id).then(({ error }) => {
        if (error) console.error('Failed to promote draft:', error.message);
      });
    const u = getAuthUser();
    if (u) logAudit({ userId: u.id, userName: u.name, userRole: u.role,
      action: 'draft.promote', entityType: 'draft', entityId: id,
      entityName: draft?.set.name || 'Untitled' });
  },

  getDraft: (id) => get().drafts.find(d => d.id === id),

  getMyDrafts: (authorId) => {
    const seen = new Set<string>();
    return get().drafts.filter(d => {
      if (d.authorId !== authorId) return false;
      if (seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });
  },

  getAllDrafts: () => {
    const seen = new Set<string>();
    return get().drafts.filter(d => {
      if (seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });
  },

  addElement: (draftId, element) => {
    const el = { ...element, id: element.id || newTBDId('RDE') };
    set(state => ({
      drafts: state.drafts.map(d => {
        if (d.id !== draftId) return d;
        const updatedSet = { ...d.set, elements: [...d.set.elements, el] };
        // Persist
        supabase.from('drafts').update({ set_data: updatedSet, updated_at: nowStr() })
          .eq('id', draftId).then(({ error }) => {
            if (error) console.error('Failed to add element:', error.message);
          });
        return { ...d, set: updatedSet, updatedAt: nowStr() };
      }),
    }));
  },

  updateElement: (draftId, elementId, element) => {
    set(state => ({
      drafts: state.drafts.map(d => {
        if (d.id !== draftId) return d;
        const elements = d.set.elements.map(e => e.id === elementId ? element : e);
        const updatedSet = { ...d.set, elements };
        supabase.from('drafts').update({ set_data: updatedSet, updated_at: nowStr() })
          .eq('id', draftId).then(({ error }) => {
            if (error) console.error('Failed to update element:', error.message);
          });
        return { ...d, set: updatedSet, updatedAt: nowStr() };
      }),
    }));
  },

  removeElement: (draftId, elementId) => {
    set(state => ({
      drafts: state.drafts.map(d => {
        if (d.id !== draftId) return d;
        const elements = d.set.elements.filter(e => e.id !== elementId);
        const updatedSet = { ...d.set, elements };
        supabase.from('drafts').update({ set_data: updatedSet, updated_at: nowStr() })
          .eq('id', draftId).then(({ error }) => {
            if (error) console.error('Failed to remove element:', error.message);
          });
        return { ...d, set: updatedSet, updatedAt: nowStr() };
      }),
    }));
  },
}));
