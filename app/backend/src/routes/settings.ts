import { Router, type RequestHandler } from 'express'
import type { Pool } from 'pg'
import { z } from 'zod'
import { getUserPreferences } from '../services/chat.js'
import type { UserPreferences } from '../types.js'

const UpdatePreferencesSchema = z.object({
  detailLevel: z.string().trim().min(1).max(60).optional(),
  tone: z.string().trim().min(1).max(60).optional(),
  alwaysShowSource: z.boolean().optional(),
  suggestRelated: z.boolean().optional(),
  additionalContext: z.string().max(1000).optional(),
  connectedApps: z
    .object({
      policies: z.boolean().optional(),
      projects: z.boolean().optional(),
      profile: z.boolean().optional(),
    })
    .optional(),
})

export function createSettingsRouter(
  pool: Pool,
  requireAuth: RequestHandler,
): Router {
  const router = Router()

  router.get('/preferences', requireAuth, async (req, res) => {
    const preferences = await getUserPreferences(pool, req.user!.login)
    res.json({ preferences })
  })

  router.put('/preferences', requireAuth, async (req, res) => {
    const parsed = UpdatePreferencesSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: 'Las preferencias enviadas no son válidas.' })
      return
    }

    const userLogin = req.user!.login
    const current = await getUserPreferences(pool, userLogin)
    const input = parsed.data

    const nextDetailLevel = input.detailLevel ?? current.detailLevel
    const nextTone = input.tone ?? current.tone
    const nextAlwaysShowSource =
      input.alwaysShowSource !== undefined
        ? input.alwaysShowSource
        : current.alwaysShowSource
    const nextSuggestRelated =
      input.suggestRelated !== undefined
        ? input.suggestRelated
        : current.suggestRelated
    const nextAdditionalContext =
      input.additionalContext !== undefined
        ? input.additionalContext
        : current.additionalContext
    const nextConnectedApps = {
      policies:
        input.connectedApps?.policies !== undefined
          ? input.connectedApps.policies
          : current.connectedApps.policies,
      projects:
        input.connectedApps?.projects !== undefined
          ? input.connectedApps.projects
          : current.connectedApps.projects,
      profile:
        input.connectedApps?.profile !== undefined
          ? input.connectedApps.profile
          : current.connectedApps.profile,
    }

    const result = await pool.query<{ updated_at: Date }>(
      `
      INSERT INTO user_preferences (
        user_login,
        detail_level,
        tone,
        always_show_source,
        suggest_related,
        additional_context,
        connected_apps,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, NOW())
      ON CONFLICT (user_login) DO UPDATE SET
        detail_level = EXCLUDED.detail_level,
        tone = EXCLUDED.tone,
        always_show_source = EXCLUDED.always_show_source,
        suggest_related = EXCLUDED.suggest_related,
        additional_context = EXCLUDED.additional_context,
        connected_apps = EXCLUDED.connected_apps,
        updated_at = NOW()
      RETURNING updated_at
      `,
      [
        userLogin,
        nextDetailLevel,
        nextTone,
        nextAlwaysShowSource,
        nextSuggestRelated,
        nextAdditionalContext,
        JSON.stringify(nextConnectedApps),
      ],
    )

    const preferences: UserPreferences = {
      detailLevel: nextDetailLevel,
      tone: nextTone,
      alwaysShowSource: nextAlwaysShowSource,
      suggestRelated: nextSuggestRelated,
      additionalContext: nextAdditionalContext,
      connectedApps: nextConnectedApps,
      updatedAt: result.rows[0].updated_at.toISOString(),
    }

    res.json({ preferences })
  })

  return router
}
