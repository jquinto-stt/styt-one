import { Router } from 'express'

export const healthRouter = Router()

// GET /api/health: confirma que el servicio está vivo.
healthRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'styt-one-backend',
    timestamp: new Date().toISOString(),
  })
})
