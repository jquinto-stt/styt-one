import type { RequestHandler } from 'express'
import type { Pool } from 'pg'
import { hashToken } from '../lib/crypto.js'
import { logAuditEvent } from '../services/audit.js'
import type { DemoUser, Role } from '../types.js'

export const SESSION_COOKIE_NAME = 'styt_one_session'

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const result: Record<string, string> = {}
  if (!cookieHeader) return result

  const pairs = cookieHeader.split(';')
  for (const pair of pairs) {
    const eqIndex = pair.indexOf('=')
    if (eqIndex <= 0) continue
    const key = pair.slice(0, eqIndex).trim()
    const rawValue = pair.slice(eqIndex + 1).trim()
    if (!key) continue
    try {
      result[key] = decodeURIComponent(rawValue)
    } catch {
      result[key] = rawValue
    }
  }
  return result
}

export function buildSessionCookie(
  token: string,
  ttlHours: number,
  secure: boolean,
): string {
  const maxAge = Math.floor(ttlHours * 3600)
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${maxAge}`,
  ]
  if (secure) parts.push('Secure')
  return parts.join('; ')
}

export function buildClearSessionCookie(secure: boolean): string {
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    'Max-Age=0',
  ]
  if (secure) parts.push('Secure')
  return parts.join('; ')
}

interface SessionUserRow {
  login: string
  name: string
  initials: string
  email: string
  role: Role
  area: string
}

export function createAuthMiddleware(pool: Pool) {
  const requireAuth: RequestHandler = async (req, res, next) => {
    const cookies = parseCookies(req.headers.cookie)
    const token = cookies[SESSION_COOKIE_NAME]
    if (!token) {
      res.status(401).json({ error: 'Sesión no autenticada.' })
      return
    }

    const tokenHash = hashToken(token)
    const result = await pool.query<SessionUserRow>(
      `
      SELECT u.login, u.name, u.initials, u.email, u.role, u.area
      FROM sessions s
      JOIN users u ON u.login = s.user_login
      WHERE s.token_hash = $1
        AND s.revoked_at IS NULL
        AND s.expires_at > NOW()
      LIMIT 1
      `,
      [tokenHash],
    )

    const row = result.rows[0]
    if (!row) {
      res.status(401).json({ error: 'Sesión inválida o expirada.' })
      return
    }

    const user: DemoUser = {
      login: row.login,
      name: row.name,
      initials: row.initials,
      email: row.email,
      role: row.role,
      area: row.area,
    }

    req.user = user
    req.sessionTokenHash = tokenHash
    next()
  }

  const requireAdmin: RequestHandler = async (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ error: 'Sesión no autenticada.' })
      return
    }
    if (req.user.role !== 'Administrador') {
      await logAuditEvent(pool, {
        eventType: 'admin_access_denied',
        actorLogin: req.user.login,
        resource: req.originalUrl,
        outcome: 'denied',
        details: { role: req.user.role },
      })
      res.status(403).json({
        error: 'Acceso restringido a administradores autorizados.',
      })
      return
    }
    next()
  }

  return { requireAuth, requireAdmin }
}
