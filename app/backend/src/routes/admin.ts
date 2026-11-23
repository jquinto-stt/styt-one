import { Router, type RequestHandler } from 'express'
import type { Pool } from 'pg'
import { z } from 'zod'
import { logAuditEvent } from '../services/audit.js'
import type { AiProvider } from '../services/azure-ai.js'
import {
  buildPolicyEmbeddingText,
  buildProjectEmbeddingText,
  embedPolicyVersion,
  embedProject,
} from '../services/retrieval.js'
import type { AuditLogRecord, PolicySummary, ProjectRecord } from '../types.js'

const PublishPolicyVersionSchema = z.object({
  section: z.string().trim().min(1).max(200),
  summary: z.string().trim().max(500).optional(),
  body: z.string().trim().min(1).max(10_000),
  current: z.boolean().optional(),
  updated: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
})

const UpdateProjectSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().min(1).max(2000),
  owner: z.string().trim().min(1).max(120),
  status: z.string().trim().min(1).max(120),
  updated: z
    .union([
      z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
      z.literal(''),
      z.null(),
    ])
    .optional(),
})

interface PolicyRow {
  topic: string
  title: string
  category: string
  section: string
  version: number
  current: boolean
  updated: string
  summary: string
  body: string
}

interface ProjectRow {
  id: string
  name: string
  description: string
  owner: string
  status: string
  updated: string | null
  members: string[]
}

interface AuditRow {
  id: number
  event_type: string
  actor_login: string | null
  resource: string | null
  outcome: string
  details: Record<string, unknown> | null
  created_at: Date
}

function summarizeBody(body: string): string {
  const compact = body.replace(/\s+/g, ' ').trim()
  if (compact.length <= 200) return compact
  return `${compact.slice(0, 197).trimEnd()}...`
}

export function createAdminRouter(
  pool: Pool,
  aiProvider: AiProvider,
  requireAuth: RequestHandler,
  requireAdmin: RequestHandler,
): Router {
  const router = Router()

  router.use(requireAuth, requireAdmin)

  router.get('/overview', async (_req, res) => {
    const [policiesResult, projectsResult, countsResult] = await Promise.all([
      pool.query<PolicyRow>(`
        SELECT * FROM (
          SELECT DISTINCT ON (pv.topic)
            p.topic,
            p.title,
            p.category,
            pv.section,
            pv.version,
            pv.current,
            pv.updated,
            pv.summary,
            pv.body
          FROM policy_versions pv
          JOIN policies p ON p.topic = pv.topic
          ORDER BY pv.topic, pv.version DESC
        ) latest
        ORDER BY title ASC
      `),
      pool.query<ProjectRow>(`
        SELECT
          p.id,
          p.name,
          p.description,
          p.owner,
          p.status,
          p.updated,
          COALESCE(
            ARRAY_AGG(u.name ORDER BY u.name) FILTER (WHERE u.name IS NOT NULL),
            ARRAY[]::text[]
          ) AS members
        FROM projects p
        LEFT JOIN project_members pm ON pm.project_id = p.id
        LEFT JOIN users u ON u.login = pm.user_login
        GROUP BY p.id
        ORDER BY p.name ASC
      `),
      pool.query<{
        users_count: string
        policies_count: string
        projects_count: string
        conversations_count: string
        audit_count: string
      }>(`
        SELECT
          (SELECT COUNT(*) FROM users)::text AS users_count,
          (SELECT COUNT(*) FROM policies)::text AS policies_count,
          (SELECT COUNT(*) FROM projects)::text AS projects_count,
          (SELECT COUNT(*) FROM conversations)::text AS conversations_count,
          (SELECT COUNT(*) FROM audit_logs)::text AS audit_count
      `),
    ])

    const policies: PolicySummary[] = policiesResult.rows.map((row) => ({
      topic: row.topic,
      title: row.title,
      category: row.category,
      section: row.section,
      version: row.version,
      current: row.current,
      updated: row.updated,
      summary: row.summary,
      body: row.body,
    }))

    const projects: ProjectRecord[] = projectsResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      owner: row.owner,
      status: row.status,
      updated: row.updated,
      members: row.members,
    }))

    const c = countsResult.rows[0]
    res.json({
      policies,
      projects,
      stats: {
        usersCount: Number(c?.users_count ?? 0),
        policiesCount: Number(c?.policies_count ?? 0),
        projectsCount: Number(c?.projects_count ?? 0),
        conversationsCount: Number(c?.conversations_count ?? 0),
        auditCount: Number(c?.audit_count ?? 0),
      },
    })
  })

  router.post('/policies/:topic/versions', async (req, res) => {
    const topic = String(req.params.topic ?? '').trim()
    const parsed = PublishPolicyVersionSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'Los datos de la versión de política no son válidos.' })
      return
    }

    const { section, body } = parsed.data
    const current = parsed.data.current ?? true
    const updated = parsed.data.updated ?? new Date().toISOString().slice(0, 10)
    const summary =
      parsed.data.summary && parsed.data.summary.length > 0
        ? parsed.data.summary
        : summarizeBody(body)

    const client = await pool.connect()
    let publishedPolicy: PolicySummary | null = null
    let insertedVersionId = 0

    try {
      await client.query('BEGIN')

      const policyMeta = await client.query<{
        topic: string
        title: string
        category: string
      }>(
        `SELECT topic, title, category FROM policies WHERE topic = $1 FOR UPDATE`,
        [topic],
      )

      const meta = policyMeta.rows[0]
      if (!meta) {
        await client.query('ROLLBACK')
        res.status(404).json({ error: 'Política no encontrada.' })
        return
      }

      const maxResult = await client.query<{ max_version: number }>(
        `SELECT COALESCE(MAX(version), 0) AS max_version FROM policy_versions WHERE topic = $1`,
        [topic],
      )
      const nextVersion = Number(maxResult.rows[0]?.max_version ?? 0) + 1

      if (current) {
        await client.query(
          `UPDATE policy_versions SET current = FALSE WHERE topic = $1 AND current = TRUE`,
          [topic],
        )
      }

      const insertResult = await client.query<{ id: number }>(
        `
        INSERT INTO policy_versions (
          topic, version, section, current, updated, summary, body, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
        `,
        [
          topic,
          nextVersion,
          section,
          current,
          updated,
          summary,
          body,
          req.user!.login,
        ],
      )

      insertedVersionId = insertResult.rows[0].id
      publishedPolicy = {
        topic: meta.topic,
        title: meta.title,
        category: meta.category,
        section,
        version: nextVersion,
        current,
        updated,
        summary,
        body,
      }

      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }

    await embedPolicyVersion(
      pool,
      aiProvider,
      insertedVersionId,
      buildPolicyEmbeddingText(publishedPolicy),
    )

    await logAuditEvent(pool, {
      eventType: 'admin_policy_published',
      actorLogin: req.user!.login,
      resource: `policy:${topic}`,
      outcome: 'success',
      details: { version: publishedPolicy.version, current: publishedPolicy.current },
    })

    res.status(201).json({ policy: publishedPolicy })
  })

  router.put('/projects/:id', async (req, res) => {
    const projectId = String(req.params.id ?? '').trim()
    const parsed = UpdateProjectSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'Los datos del proyecto no son válidos.' })
      return
    }

    const existing = await pool.query<{ id: string; updated: string | null }>(
      `SELECT id, updated FROM projects WHERE id = $1 LIMIT 1`,
      [projectId],
    )
    if (!existing.rows[0]) {
      res.status(404).json({ error: 'Proyecto no encontrado.' })
      return
    }

    const { name, description, owner, status, updated } = parsed.data
    const normalizedUpdated =
      updated === undefined
        ? existing.rows[0].updated
        : updated === '' || updated === null
          ? null
          : updated

    await pool.query(
      `
      UPDATE projects
      SET
        name = COALESCE($2, name),
        description = $3,
        owner = $4,
        status = $5,
        updated = $6,
        embedding = NULL,
        updated_at = NOW()
      WHERE id = $1
      `,
      [projectId, name ?? null, description, owner, status, normalizedUpdated],
    )

    const result = await pool.query<ProjectRow>(
      `
      SELECT
        p.id,
        p.name,
        p.description,
        p.owner,
        p.status,
        p.updated,
        COALESCE(
          ARRAY_AGG(u.name ORDER BY u.name) FILTER (WHERE u.name IS NOT NULL),
          ARRAY[]::text[]
        ) AS members
      FROM projects p
      LEFT JOIN project_members pm ON pm.project_id = p.id
      LEFT JOIN users u ON u.login = pm.user_login
      WHERE p.id = $1
      GROUP BY p.id
      LIMIT 1
      `,
      [projectId],
    )

    const row = result.rows[0]
    const project: ProjectRecord = {
      id: row.id,
      name: row.name,
      description: row.description,
      owner: row.owner,
      status: row.status,
      updated: row.updated,
      members: row.members,
    }

    await embedProject(pool, aiProvider, project.id, buildProjectEmbeddingText(project))

    await logAuditEvent(pool, {
      eventType: 'admin_project_updated',
      actorLogin: req.user!.login,
      resource: `project:${project.id}`,
      outcome: 'success',
      details: { status: project.status, updated: project.updated },
    })

    res.json({ project })
  })

  router.get('/audit', async (req, res) => {
    const rawLimit = Number(req.query.limit ?? 50)
    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.min(Math.floor(rawLimit), 200)
        : 50

    const result = await pool.query<AuditRow>(
      `
      SELECT id, event_type, actor_login, resource, outcome, details, created_at
      FROM audit_logs
      ORDER BY created_at DESC, id DESC
      LIMIT $1
      `,
      [limit],
    )

    const logs: AuditLogRecord[] = result.rows.map((row) => ({
      id: row.id,
      eventType: row.event_type,
      actorLogin: row.actor_login,
      resource: row.resource,
      outcome: row.outcome,
      details: row.details ?? {},
      createdAt: row.created_at.toISOString(),
    }))

    res.json({ logs })
  })

  return router
}
