import { Router, type RequestHandler } from 'express'
import type { Pool } from 'pg'
import type { PolicyDetail, PolicySummary } from '../types.js'

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

interface PolicyVersionRow {
  id: number
  version: number
  section: string
  current: boolean
  updated: string
  summary: string
  body: string
  created_by: string | null
  created_at: Date
}

export function createPoliciesRouter(
  pool: Pool,
  requireAuth: RequestHandler,
): Router {
  const router = Router()

  router.get('/', requireAuth, async (req, res) => {
    const category =
      typeof req.query.category === 'string' && req.query.category.trim().length > 0
        ? req.query.category.trim()
        : null

    const result =
      category && category !== 'Todas'
        ? await pool.query<PolicyRow>(
            `
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
              WHERE p.category = $1
              ORDER BY pv.topic, pv.version DESC
            ) latest
            ORDER BY title ASC
            `,
            [category],
          )
        : await pool.query<PolicyRow>(`
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
          `)

    const policies: PolicySummary[] = result.rows.map((row) => ({
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

    res.json({ policies })
  })

  router.get('/:topic', requireAuth, async (req, res) => {
    const topic = String(req.params.topic ?? '').trim()
    if (!topic) {
      res.status(404).json({ error: 'Documento no encontrado.' })
      return
    }

    const policyMeta = await pool.query<{
      topic: string
      title: string
      category: string
    }>(
      `SELECT topic, title, category FROM policies WHERE topic = $1 LIMIT 1`,
      [topic],
    )

    const meta = policyMeta.rows[0]
    if (!meta) {
      res.status(404).json({ error: 'Documento no encontrado.' })
      return
    }

    const versionsResult = await pool.query<PolicyVersionRow>(
      `
      SELECT id, version, section, current, updated, summary, body, created_by, created_at
      FROM policy_versions
      WHERE topic = $1
      ORDER BY version DESC
      `,
      [topic],
    )

    const latest = versionsResult.rows[0]
    if (!latest) {
      res.status(404).json({ error: 'Documento no encontrado.' })
      return
    }

    const policy: PolicyDetail = {
      topic: meta.topic,
      title: meta.title,
      category: meta.category,
      section: latest.section,
      version: latest.version,
      current: latest.current,
      updated: latest.updated,
      summary: latest.summary,
      body: latest.body,
      versions: versionsResult.rows.map((v) => ({
        id: v.id,
        version: v.version,
        section: v.section,
        current: v.current,
        updated: v.updated,
        summary: v.summary,
        body: v.body,
        createdBy: v.created_by,
        createdAt: v.created_at.toISOString(),
      })),
    }

    res.json({ policy })
  })

  return router
}
