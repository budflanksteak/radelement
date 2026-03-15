import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CDESet, CDEElement, Draft } from '../types/cde';

interface DraftsState {
  drafts: Draft[];
  createDraft: (authorId: string, authorName: string, base?: Partial<CDESet>) => Draft;
  updateDraft: (id: string, set: CDESet) => void;
  deleteDraft: (id: string) => void;
  submitForReview: (id: string) => void;
  retractFromReview: (id: string) => void;
  getDraft: (id: string) => Draft | undefined;
  getMyDrafts: (authorId: string) => Draft[];
  addElement: (draftId: string, element: CDEElement) => void;
  updateElement: (draftId: string, elementId: string, element: CDEElement) => void;
  removeElement: (draftId: string, elementId: string) => void;
}

function newTBDId(prefix: 'RDES' | 'RDE'): string {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}TO_BE_DETERMINED${n}`;
}

function now(): string {
  return new Date().toISOString();
}

const DEFAULT_SET: CDESet = {
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

export const useDraftsStore = create<DraftsState>()(
  persist(
    (set, get) => ({
      drafts: [],

      createDraft: (authorId, authorName, base = {}) => {
        const draft: Draft = {
          id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          set: { ...DEFAULT_SET, id: newTBDId('RDES'), ...base } as CDESet,
          createdAt: now(),
          updatedAt: now(),
          authorId,
          authorName,
          submittedForReview: false,
          reviewComments: [],
        };
        set(state => {
          // Guard against duplicate IDs that can arise from localStorage corruption
          const existing = state.drafts.some(d => d.id === draft.id);
          return { drafts: existing ? state.drafts : [...state.drafts, draft] };
        });
        return draft;
      },

      updateDraft: (id, updatedSet) => {
        set(state => ({
          drafts: state.drafts.map(d =>
            d.id === id ? { ...d, set: updatedSet, updatedAt: now() } : d
          )
        }));
      },

      deleteDraft: (id) => {
        set(state => ({ drafts: state.drafts.filter(d => d.id !== id) }));
      },

      submitForReview: (id) => {
        set(state => ({
          drafts: state.drafts.map(d =>
            d.id === id ? { ...d, submittedForReview: true, updatedAt: now() } : d
          )
        }));
      },

      retractFromReview: (id) => {
        set(state => ({
          drafts: state.drafts.map(d =>
            d.id === id ? { ...d, submittedForReview: false, updatedAt: now() } : d
          )
        }));
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

      addElement: (draftId, element) => {
        set(state => ({
          drafts: state.drafts.map(d => {
            if (d.id !== draftId) return d;
            const el = { ...element, id: element.id || newTBDId('RDE') };
            return { ...d, set: { ...d.set, elements: [...d.set.elements, el] }, updatedAt: now() };
          })
        }));
      },

      updateElement: (draftId, elementId, element) => {
        set(state => ({
          drafts: state.drafts.map(d => {
            if (d.id !== draftId) return d;
            const elements = d.set.elements.map(e => e.id === elementId ? element : e);
            return { ...d, set: { ...d.set, elements }, updatedAt: now() };
          })
        }));
      },

      removeElement: (draftId, elementId) => {
        set(state => ({
          drafts: state.drafts.map(d => {
            if (d.id !== draftId) return d;
            const elements = d.set.elements.filter(e => e.id !== elementId);
            return { ...d, set: { ...d.set, elements }, updatedAt: now() };
          })
        }));
      },
    }),
    { name: 'radelement-drafts' }
  )
);
