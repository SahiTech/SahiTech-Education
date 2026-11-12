import { createClient } from '@/lib/supabase/server';

export interface AuditLogParams {
  tenantId: string;
  actorId?: string;
  actorRole: string;
  action: string;
  entityName: string;
  entityId: string;
  previousState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  isSupportImpersonation?: boolean;
}

export async function logAuditEvent(params: AuditLogParams) {
  try {
    const supabase = await createClient();
    await supabase.from('audit_logs').insert({
      tenant_id: params.tenantId,
      actor_id: params.actorId || null,
      actor_role: params.actorRole,
      action: params.action,
      entity_name: params.entityName,
      entity_id: params.entityId,
      previous_state: params.previousState ? JSON.stringify(params.previousState) : null,
      new_state: params.newState ? JSON.stringify(params.newState) : null,
      is_support_impersonation: params.isSupportImpersonation || false,
    });
  } catch (err) {
    // Audit log failures should be alerted but not crash non-critical client operations
    console.error('Audit log emission failed:', err);
  }
}

