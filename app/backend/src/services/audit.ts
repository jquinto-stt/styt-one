import type { Pool } from 'pg'

export interface AuditEventInput {
  eventType: string
  actorLogin?: string | null
  resource?: string | null
  outcome: string
  details?: Record<string, unknown>
}

export async function logAuditEvent(pool: Pool, input: AuditEventInput): Promise<void> {
  try {
    await pool.query(
      `
      INSERT INTO audit_logs (event_type, actor_login, resource, outcome, details)
      VALUES ($1, $2, $3, $4, $5::jsonb)
      `,
      [
        input.eventType,
        input.actorLogin ?? null,
        input.resource ?? null,
        input.outcome,
        JSON.stringify(input.details ?? {}),
      ],
    )
  } catch (err) {
    console.error(
      '[audit] Failed to write audit log:',
      err instanceof Error ? err.message : 'Unknown error',
    )
  }
}
