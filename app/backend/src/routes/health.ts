import { Router } from 'express'
import type { Pool } from 'pg'
import type { AiProvider } from '../services/azure-ai.js'

export function createHealthRouter(pool: Pool, aiProvider: AiProvider): Router {
  const router = Router()

  router.get('/', async (_req, res) => {
    try {
      await pool.query('SELECT 1')
      res.json({
        status: 'ok',
        service: 'styt-one-backend',
        database: 'connected',
        aiConfigured: aiProvider.isConfigured(),
        chatDeployment: aiProvider.getChatDeployment(),
        contentSafetyConfigured: aiProvider.isContentSafetyConfigured(),
        voiceConfigured: aiProvider.isVoiceConfigured(),
        speechConfigured: aiProvider.isSpeechConfigured(),
        realtimeConfigured: aiProvider.isRealtimeConfigured(),
        realtimeDeployment: aiProvider.getRealtimeDeployment(),
        timestamp: new Date().toISOString(),
      })
    } catch {
      res.status(503).json({
        status: 'error',
        service: 'styt-one-backend',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      })
    }
  })

  return router
}
