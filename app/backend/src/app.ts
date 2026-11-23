import express from 'express'
import { healthRouter } from './routes/health.js'

/** Construye la app Express: middlewares y rutas. No abre ningún puerto. */
export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.use(express.json())

  app.use('/api/health', healthRouter)

  // Cualquier otra ruta bajo /api que no exista.
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' })
  })

  return app
}
