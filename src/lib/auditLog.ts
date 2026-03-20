import { supabase } from './supabase';

export type AuditAction =
  | 'user.login'
  | 'user.role_change'
  | 'user.deactivate'
  | 'user.reactivate'
  | 'draft.create'
  | 'draft.update'
  | 'draft.submit_review'
  | 'draft.retract_review'
  | 'draft.promote'
  | 'draft.delete';

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  'user.login':           'Signed in',
  'user.role_change':     'Role changed',
  'user.deactivate':      'Deactivated',
  'user.reactivate':      'Reactivated',
  'draft.create':         'Draft created',
  'draft.update':         'Draft updated',
  'draft.submit_review':  'Submitted for review',
  'draft.retract_review': 'Retracted from review',
  'draft.promote':        'Promoted to Proposed',
  'draft.delete':         'Draft deleted',
};

export const AUDIT_ACTION_COLORS: Record<AuditAction, string> = {
  'user.login':           'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  'user.role_change':     'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  'user.deactivate':      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'user.reactivate':      'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  'draft.create':         'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'draft.update':         'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  'draft.submit_review':  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'draft.retract_review': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'draft.promote':        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  'draft.delete':         'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
};

export interface AuditParams {
  userId: string;
  userName: string;
  userRole: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  details?: Record<string, unknown>;
}

/** Best-effort: silently ignores any Supabase error so it never disrupts the calling action. */
export function logAudit(params: AuditParams): void {
  supabase.from('audit_log').insert({
    user_id:     params.userId,
    user_name:   params.userName,
    user_role:   params.userRole,
    action:      params.action,
    entity_type: params.entityType ?? null,
    entity_id:   params.entityId ?? null,
    entity_name: params.entityName ?? null,
    details:     params.details ?? null,
  }).then(({ error }) => {
    if (error) console.warn('audit log insert failed:', error.message);
  });
}
