import { supabaseAdmin } from './supabaseAdmin.js'

export interface AuditLogEntry {
  actorId?: string | null
  actorName?: string | null
  actorRole?: string | null
  action: string
  entityType: 'group' | 'booking' | 'passenger' | 'payment' | 'ticket' | 'room' | 'system'
  entityId: string
  oldValues?: Record<string, unknown> | null
  newValues?: Record<string, unknown> | null
  reason?: string | null
  ipAddress?: string | null
}

/**
 * Inserts an immutable audit log record to public.audit_logs
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from('audit_logs').insert({
      actor_id: entry.actorId || null,
      actor_name: entry.actorName || 'System',
      actor_role: entry.actorRole || 'system',
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: String(entry.entityId),
      old_values: entry.oldValues || null,
      new_values: entry.newValues || null,
      reason: entry.reason || null,
      ip_address: entry.ipAddress || null,
    })

    if (error) {
      console.error('[AUDIT LOG ERROR]', error.message, entry)
    }
  } catch (err) {
    console.error('[AUDIT LOG EXCEPTION]', err, entry)
  }
}
