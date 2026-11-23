import { Router, type RequestHandler } from 'express'
import type { Pool } from 'pg'
import { logAuditEvent } from '../services/audit.js'
import type { ProjectRecord } from '../types.js'

interface ProjectRow {
  id: string
  name: string
  description: string
  owner: string
  status: string
  updated: string | null
  members: string[]
}

export function createProjectsRouter(
  pool: Pool,
  requireAuth: RequestHandler,
): Router {
  const router = Router()

  router.get('/', requireAuth, async (req, res) => {
    const user = req.user!
    const isAdmin = user.role === 'Administrador'

    const result = isAdmin
      ? await pool.query<ProjectRow>(`
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
        `)
      : await pool.query<ProjectRow>(
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
          WHERE EXISTS (
            SELECT 1
            FROM project_members auth_pm
            WHERE auth_pm.project_id = p.id
              AND auth_pm.user_login = $1
          )
          GROUP BY p.id
          ORDER BY p.name ASC
          `,
          [user.login],
        )

    const projects: ProjectRecord[] = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      owner: row.owner,
      status: row.status,
      updated: row.updated,
      members: row.members,
    }))

    res.json({ projects })
  })

  router.get('/:id', requireAuth, async (req, res) => {
    const user = req.user!
    const projectId = String(req.params.id ?? '').trim()

    const exists = await pool.query<{ id: string }>(
      `SELECT id FROM projects WHERE id = $1 LIMIT 1`,
      [projectId],
    )
    if (!exists.rows[0]) {
      res.status(404).json({ error: 'Proyecto no encontrado.' })
      return
    }

    if (user.role !== 'Administrador') {
      const membership = await pool.query<{ ok: number }>(
        `
        SELECT 1 AS ok
        FROM project_members
        WHERE project_id = $1 AND user_login = $2
        LIMIT 1
        `,
        [projectId, user.login],
      )
      if (!membership.rows[0]) {
        await logAuditEvent(pool, {
          eventType: 'project_access_denied',
          actorLogin: user.login,
          resource: `project:${projectId}`,
          outcome: 'denied',
        })
        res.status(403).json({
          error: 'No tienes permiso para consultar este proyecto.',
        })
        return
      }
    }

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

    res.json({ project })
  })

  return router
}
