import { Router, type RequestHandler } from 'express'
import type { Pool } from 'pg'
import { z } from 'zod'
import type { AppConfig } from '../config.js'
import {
  generateSessionToken,
  hashToken,
  verifyPassword,
} from '../lib/crypto.js'
import {
  buildClearSessionCookie,
  buildSessionCookie,
  parseCookies,
  SESSION_COOKIE_NAME,
} from '../middleware/auth.js'
import { logAuditEvent } from '../services/audit.js'
import type { DemoUser, Role } from '../types.js'

const LoginSchema = z.object({
  login: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(128),
})

interface UserRow {
  login: string
  name: string
  initials: string
  email: string
  role: Role
  area: string
  password_hash: string
}

export function createAuthRouter(
  pool: Pool,
  config: AppConfig,
  requireAuth: RequestHandler,
): Router {
  const router = Router()

  router.get('/demo-accounts', async (_req, res) => {
    const result = await pool.query<Omit<UserRow, 'password_hash'>>(`
      SELECT login, name, initials, email, role, area
      FROM users
      ORDER BY
        CASE login
          WHEN 'colaborador' THEN 1
          WHEN 'lider' THEN 2
          WHEN 'admin' THEN 3
          ELSE 4
        END ASC,
        name ASC
    `)

    res.json({
      accounts: result.rows.map((row) => ({
        login: row.login,
        name: row.name,
        initials: row.initials,
        email: row.email,
        role: row.role,
        area: row.area,
      })),
    })
  })

  router.post('/login', async (req, res) => {
    const parsed = LoginSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'Debes indicar cuenta y contraseña.' })
      return
    }

    const { login, password } = parsed.data
    const result = await pool.query<UserRow>(
      `
      SELECT login, name, initials, email, role, area, password_hash
      FROM users
      WHERE login = $1
      LIMIT 1
      `,
      [login],
    )

    const row = result.rows[0]
    if (!row || !verifyPassword(password, row.password_hash)) {
      await logAuditEvent(pool, {
        eventType: 'auth_login_failed',
        actorLogin: login,
        resource: 'session',
        outcome: 'denied',
      })
      res.status(401).json({
        error: 'La cuenta o la contraseña no son correctas.',
      })
      return
    }

    const token = generateSessionToken()
    const tokenHash = hashToken(token)

    await pool.query(
      `
      INSERT INTO sessions (token_hash, user_login, expires_at)
      VALUES ($1, $2, NOW() + make_interval(hours => $3))
      `,
      [tokenHash, row.login, config.sessionTtlHours],
    )

    const user: DemoUser = {
      login: row.login,
      name: row.name,
      initials: row.initials,
      email: row.email,
      role: row.role,
      area: row.area,
    }

    await logAuditEvent(pool, {
      eventType: 'auth_login_success',
      actorLogin: user.login,
      resource: 'session',
      outcome: 'success',
      details: { role: user.role },
    })

    res.setHeader(
      'Set-Cookie',
      buildSessionCookie(token, config.sessionTtlHours, config.cookieSecure),
    )
    res.json({ user })
  })

  router.post('/logout', async (req, res) => {
    const cookies = parseCookies(req.headers.cookie)
    const token = cookies[SESSION_COOKIE_NAME]

    if (token) {
      const tokenHash = hashToken(token)
      const revoked = await pool.query<{ user_login: string }>(
        `
        UPDATE sessions
        SET revoked_at = NOW()
        WHERE token_hash = $1 AND revoked_at IS NULL
        RETURNING user_login
        `,
        [tokenHash],
      )

      if (revoked.rows[0]) {
        await logAuditEvent(pool, {
          eventType: 'auth_logout',
          actorLogin: revoked.rows[0].user_login,
          resource: 'session',
          outcome: 'success',
        })
      }
    }

    res.setHeader('Set-Cookie', buildClearSessionCookie(config.cookieSecure))
    res.json({ ok: true })
  })

  router.get('/me', requireAuth, (req, res) => {
    res.json({ user: req.user })
  })

  return router
}
