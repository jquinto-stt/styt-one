import express from 'express'
import { healthRouter } from './routes/health.js'

/** Crea la app Express. Los slices posteriores montan aquí sus routers (tareas, auth...). */
export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.use(express.json())

  app.use('/api/health', healthRouter)

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' })
  })

  return app
}
