import { Router, type RequestHandler } from 'express'
import type { Pool } from 'pg'
import { z } from 'zod'
import { isValidUuid } from '../lib/errors.js'
import { logAuditEvent } from '../services/audit.js'
import { mapMessageRow } from '../services/chat.js'
import type { ConversationSummary, EvidenceKind } from '../types.js'

const PatchConversationSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    folderId: z.string().nullable().optional(),
    archived: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.folderId !== undefined ||
      data.archived !== undefined,
    { message: 'At least one field must be provided' },
  )

interface ConversationRow {
  id: string
  user_login: string
  title: string
  folder_id: string | null
  folder_name: string | null
  archived: boolean
  preview: string | null
  created_at: Date
  updated_at: Date
}

interface MessageRow {
  id: string
  conversation_id: string
  sender: 'user' | 'assistant'
  text: string
  kind: EvidenceKind | null
  source_label: string | null
  source_to: string | null
  choices: unknown
  created_at: Date
}

function mapConversationRow(row: ConversationRow): ConversationSummary {
  return {
    id: row.id,
    title: row.title,
    folderId: row.folder_id,
    folderName: row.folder_name,
    archived: row.archived,
    preview: row.preview,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

export function createConversationsRouter(
  pool: Pool,
  requireAuth: RequestHandler,
): Router {
  const router = Router()

  router.get('/', requireAuth, async (req, res) => {
    const user = req.user!
    const archivedParam =
      typeof req.query.archived === 'string' ? req.query.archived.trim() : 'false'
    const folderIdParam =
      typeof req.query.folderId === 'string' && req.query.folderId.trim().length > 0
        ? req.query.folderId.trim()
        : null

    if (folderIdParam && !isValidUuid(folderIdParam)) {
      res.status(400).json({ error: 'El identificador de carpeta no es válido.' })
      return
    }

    const params: unknown[] = [user.login]
    const conditions: string[] = ['c.user_login = $1']

    if (archivedParam === 'true') {
      conditions.push('c.archived = TRUE')
    } else if (archivedParam !== 'all') {
      conditions.push('c.archived = FALSE')
    }

    if (folderIdParam) {
      params.push(folderIdParam)
      conditions.push(`c.folder_id = $${params.length}`)
    }

    const result = await pool.query<ConversationRow>(
      `
      SELECT
        c.id,
        c.user_login,
        c.title,
        c.folder_id,
        f.name AS folder_name,
        c.archived,
        (
          SELECT m.text
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) AS preview,
        c.created_at,
        c.updated_at
      FROM conversations c
      LEFT JOIN folders f ON f.id = c.folder_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY c.updated_at DESC
      `,
      params,
    )

    res.json({
      conversations: result.rows.map(mapConversationRow),
    })
  })

  router.get('/:id', requireAuth, async (req, res) => {
    const user = req.user!
    const id = String(req.params.id ?? '').trim()

    if (!isValidUuid(id)) {
      res.status(400).json({ error: 'El identificador de conversación no es válido.' })
      return
    }

    const convResult = await pool.query<ConversationRow>(
      `
      SELECT
        c.id,
        c.user_login,
        c.title,
        c.folder_id,
        f.name AS folder_name,
        c.archived,
        NULL::text AS preview,
        c.created_at,
        c.updated_at
      FROM conversations c
      LEFT JOIN folders f ON f.id = c.folder_id
      WHERE c.id = $1
      LIMIT 1
      `,
      [id],
    )

    const conv = convResult.rows[0]
    if (!conv) {
      res.status(404).json({ error: 'Conversación no encontrada.' })
      return
    }

    if (conv.user_login !== user.login) {
      await logAuditEvent(pool, {
        eventType: 'conversation_access_denied',
        actorLogin: user.login,
        resource: `conversation:${id}`,
        outcome: 'denied',
      })
      res.status(403).json({ error: 'No tienes permiso para ver esta conversación.' })
      return
    }

    const messagesResult = await pool.query<MessageRow>(
      `
      SELECT id, conversation_id, sender, text, kind, source_label, source_to, choices, created_at
      FROM messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
      `,
      [id],
    )

    const messages = messagesResult.rows.map(mapMessageRow)
    const preview = messages.length > 0 ? messages[messages.length - 1].text : null

    res.json({
      conversation: mapConversationRow({ ...conv, preview }),
      messages,
    })
  })

  router.patch('/:id', requireAuth, async (req, res) => {
    const user = req.user!
    const id = String(req.params.id ?? '').trim()

    if (!isValidUuid(id)) {
      res.status(400).json({ error: 'El identificador de conversación no es válido.' })
      return
    }

    const parsed = PatchConversationSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'Los datos para actualizar la conversación no son válidos.' })
      return
    }

    const existing = await pool.query<{ user_login: string }>(
      `SELECT user_login FROM conversations WHERE id = $1 LIMIT 1`,
      [id],
    )
    if (!existing.rows[0]) {
      res.status(404).json({ error: 'Conversación no encontrada.' })
      return
    }
    if (existing.rows[0].user_login !== user.login) {
      await logAuditEvent(pool, {
        eventType: 'conversation_access_denied',
        actorLogin: user.login,
        resource: `conversation:${id}`,
        outcome: 'denied',
      })
      res.status(403).json({ error: 'No tienes permiso para modificar esta conversación.' })
      return
    }

    const { title, folderId, archived } = parsed.data
    if (folderId !== undefined && folderId !== null) {
      if (!isValidUuid(folderId)) {
        res.status(400).json({ error: 'El identificador de carpeta no es válido.' })
        return
      }
      const folderCheck = await pool.query<{ user_login: string }>(
        `SELECT user_login FROM folders WHERE id = $1 LIMIT 1`,
        [folderId],
      )
      if (!folderCheck.rows[0]) {
        res.status(404).json({ error: 'Carpeta no encontrada.' })
        return
      }
      if (folderCheck.rows[0].user_login !== user.login) {
        res.status(403).json({ error: 'No tienes permiso para usar esta carpeta.' })
        return
      }
    }

    const updates: string[] = ['updated_at = NOW()']
    const params: unknown[] = [id]

    if (title !== undefined) {
      params.push(title)
      updates.push(`title = $${params.length}`)
    }
    if (folderId !== undefined) {
      params.push(folderId)
      updates.push(`folder_id = $${params.length}`)
    }
    if (archived !== undefined) {
      params.push(archived)
      updates.push(`archived = $${params.length}`)
    }

    await pool.query(
      `UPDATE conversations SET ${updates.join(', ')} WHERE id = $1`,
      params,
    )

    const updated = await pool.query<ConversationRow>(
      `
      SELECT
        c.id,
        c.user_login,
        c.title,
        c.folder_id,
        f.name AS folder_name,
        c.archived,
        (
          SELECT m.text
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) AS preview,
        c.created_at,
        c.updated_at
      FROM conversations c
      LEFT JOIN folders f ON f.id = c.folder_id
      WHERE c.id = $1
      LIMIT 1
      `,
      [id],
    )

    res.json({ conversation: mapConversationRow(updated.rows[0]) })
  })

  router.delete('/:id', requireAuth, async (req, res) => {
    const user = req.user!
    const id = String(req.params.id ?? '').trim()

    if (!isValidUuid(id)) {
      res.status(400).json({ error: 'El identificador de conversación no es válido.' })
      return
    }

    const existing = await pool.query<{ user_login: string }>(
      `SELECT user_login FROM conversations WHERE id = $1 LIMIT 1`,
      [id],
    )
    if (!existing.rows[0]) {
      res.status(404).json({ error: 'Conversación no encontrada.' })
      return
    }
    if (existing.rows[0].user_login !== user.login) {
      await logAuditEvent(pool, {
        eventType: 'conversation_access_denied',
        actorLogin: user.login,
        resource: `conversation:${id}`,
        outcome: 'denied',
      })
      res.status(403).json({ error: 'No tienes permiso para eliminar esta conversación.' })
      return
    }

    await pool.query(`DELETE FROM conversations WHERE id = $1`, [id])
    res.json({ ok: true })
  })

  return router
}
