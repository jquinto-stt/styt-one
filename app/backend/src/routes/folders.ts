import { Router, type RequestHandler } from 'express'
import type { Pool } from 'pg'
import { z } from 'zod'
import type { FolderRecord } from '../types.js'

const CreateFolderSchema = z.object({
  name: z.string().trim().min(1).max(60),
})

interface FolderRow {
  id: string
  name: string
  count: string
  created_at: Date
}

export function createFoldersRouter(
  pool: Pool,
  requireAuth: RequestHandler,
): Router {
  const router = Router()

  router.get('/', requireAuth, async (req, res) => {
    const user = req.user!
    const result = await pool.query<FolderRow>(
      `
      SELECT
        f.id,
        f.name,
        COUNT(c.id) FILTER (WHERE c.archived = FALSE)::text AS count,
        f.created_at
      FROM folders f
      LEFT JOIN conversations c
        ON c.folder_id = f.id AND c.user_login = f.user_login
      WHERE f.user_login = $1
      GROUP BY f.id
      ORDER BY f.created_at ASC, f.name ASC
      `,
      [user.login],
    )

    const folders: FolderRecord[] = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      count: Number(row.count),
      createdAt: row.created_at.toISOString(),
    }))

    res.json({ folders })
  })

  router.post('/', requireAuth, async (req, res) => {
    const user = req.user!
    const parsed = CreateFolderSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'Escribe un nombre válido para la carpeta.' })
      return
    }

    const name = parsed.data.name

    const existing = await pool.query<{ id: string }>(
      `
      SELECT id
      FROM folders
      WHERE user_login = $1 AND LOWER(name) = LOWER($2)
      LIMIT 1
      `,
      [user.login, name],
    )

    if (existing.rows[0]) {
      res.status(409).json({ error: 'Ya existe una carpeta con ese nombre.' })
      return
    }

    try {
      const inserted = await pool.query<{ id: string; name: string; created_at: Date }>(
        `
        INSERT INTO folders (user_login, name)
        VALUES ($1, $2)
        RETURNING id, name, created_at
        `,
        [user.login, name],
      )

      const row = inserted.rows[0]
      const folder: FolderRecord = {
        id: row.id,
        name: row.name,
        count: 0,
        createdAt: row.created_at.toISOString(),
      }
      res.status(201).json({ folder })
    } catch (err) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code?: string }).code === '23505'
      ) {
        res.status(409).json({ error: 'Ya existe una carpeta con ese nombre.' })
        return
      }
      throw err
    }
  })

  return router
}
