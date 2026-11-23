import express, { type Express } from 'express'
import type { Pool } from 'pg'
import { loadConfig, type AppConfig } from './config.js'
import { errorHandler } from './lib/errors.js'
import { createAuthMiddleware } from './middleware/auth.js'
import { createAdminRouter } from './routes/admin.js'
import { createAuthRouter } from './routes/auth.js'
import { createChatRouter } from './routes/chat.js'
import { createConversationsRouter } from './routes/conversations.js'
import { createFoldersRouter } from './routes/folders.js'
import { createHealthRouter } from './routes/health.js'
import { createIntegrationsRouter } from './routes/integrations.js'
import { createPoliciesRouter } from './routes/policies.js'
import { createProfileRouter } from './routes/profile.js'
import { createProjectsRouter } from './routes/projects.js'
import { createSettingsRouter } from './routes/settings.js'
import { createVoiceRouter } from './routes/voice.js'
import { AzureAiProvider, type AiProvider } from './services/azure-ai.js'

export interface CreateAppOptions {
  pool: Pool
  aiProvider?: AiProvider
  config?: AppConfig
}

/**
 * Builds the Express application with all middleware and routes without listening on a port.
 */
export function createApp({ pool, aiProvider, config }: CreateAppOptions): Express {
  const appConfig = config ?? loadConfig()
  const provider = aiProvider ?? new AzureAiProvider(appConfig)
  const { requireAuth, requireAdmin } = createAuthMiddleware(pool)

  const app = express()

  app.disable('x-powered-by')
  app.set('trust proxy', 1)
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Referrer-Policy', 'no-referrer')
    next()
  })
  app.use('/api/voice', createVoiceRouter(pool, provider, requireAuth))
  app.use(express.json({ limit: '100kb' }))

  app.use('/api/health', createHealthRouter(pool, provider))
  app.use('/api/auth', createAuthRouter(pool, appConfig, requireAuth))
  app.use('/api/profile', createProfileRouter(requireAuth))
  app.use('/api/policies', createPoliciesRouter(pool, requireAuth))
  app.use('/api/projects', createProjectsRouter(pool, requireAuth))
  app.use('/api/chat', createChatRouter(pool, provider, requireAuth))
  app.use('/api/conversations', createConversationsRouter(pool, requireAuth))
  app.use('/api/folders', createFoldersRouter(pool, requireAuth))
  app.use('/api/integrations', createIntegrationsRouter(pool, requireAuth))
  app.use('/api/settings', createSettingsRouter(pool, requireAuth))
  app.use('/api/admin', createAdminRouter(pool, provider, requireAuth, requireAdmin))

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Recurso no encontrado.' })
  })

  app.use(errorHandler)

  return app
}
