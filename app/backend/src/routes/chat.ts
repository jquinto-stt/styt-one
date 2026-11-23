import { Router, type RequestHandler } from 'express'
import type { Pool } from 'pg'
import { z } from 'zod'
import type { AiProvider } from '../services/azure-ai.js'
import { handleChatRequest } from '../services/chat.js'

const ChatBodySchema = z.object({
  message: z.string().trim().min(1).max(2000),
  conversationId: z.string().trim().min(1).optional(),
  folderId: z.string().trim().min(1).optional(),
  sourceScope: z.enum(['all', 'policies', 'projects', 'profile']).optional(),
  voiceMode: z.boolean().optional(),
})

export function createChatRouter(
  pool: Pool,
  aiProvider: AiProvider,
  requireAuth: RequestHandler,
): Router {
  const router = Router()

  router.post('/', requireAuth, async (req, res) => {
    const parsed = ChatBodySchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        error: 'Escribe una consulta válida antes de enviar.',
      })
      return
    }

    const payload = await handleChatRequest(pool, aiProvider, {
      user: req.user!,
      message: parsed.data.message,
      conversationId: parsed.data.conversationId,
      folderId: parsed.data.folderId,
      sourceScope: parsed.data.sourceScope,
      voiceMode: parsed.data.voiceMode,
    })

    res.json(payload)
  })

  return router
}
