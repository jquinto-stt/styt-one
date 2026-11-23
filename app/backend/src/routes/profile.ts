import { Router, type RequestHandler } from 'express'

export function createProfileRouter(requireAuth: RequestHandler): Router {
  const router = Router()

  router.get('/', requireAuth, (req, res) => {
    res.json({ profile: req.user })
  })

  return router
}
