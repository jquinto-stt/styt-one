import { Router, type RequestHandler } from 'express'
import type { Pool } from 'pg'
import { getUserPreferences } from '../services/chat.js'
import type { IntegrationItem } from '../types.js'

export function createIntegrationsRouter(
  pool: Pool,
  requireAuth: RequestHandler,
): Router {
  const router = Router()

  router.get('/', requireAuth, async (req, res) => {
    const user = req.user!
    const preferences = await getUserPreferences(pool, user.login)

    const integrations: IntegrationItem[] = [
      {
        key: 'policies',
        name: 'Políticas corporativas',
        description: 'Documentos versionados y autorizados de ST&T.',
        category: 'Fuentes',
        status: preferences.connectedApps.policies ? 'Conectada' : 'Disponible',
        initials: 'PC',
        enabled: preferences.connectedApps.policies,
      },
      {
        key: 'projects',
        name: 'Fichas de proyecto',
        description: 'Catálogo de proyectos con responsable, estado y documentos.',
        category: 'Fuentes',
        status: preferences.connectedApps.projects ? 'Conectada' : 'Disponible',
        initials: 'FP',
        enabled: preferences.connectedApps.projects,
      },
      {
        key: 'profile',
        name: 'Perfil del colaborador',
        description: 'Campos mínimos autorizados del usuario autenticado.',
        category: 'Fuentes',
        status: preferences.connectedApps.profile ? 'Conectada' : 'Disponible',
        initials: 'PE',
        enabled: preferences.connectedApps.profile,
      },
      {
        key: 'repositories',
        name: 'Repositorios de código',
        description: 'Integración prevista para evolución posterior al MVP.',
        category: 'Herramientas',
        status: 'Próximamente',
        initials: 'RC',
        enabled: false,
      },
      {
        key: 'project-management',
        name: 'Gestión de proyectos',
        description: 'Conector futuro con la herramienta de seguimiento de ST&T.',
        category: 'Herramientas',
        status: 'Próximamente',
        initials: 'GP',
        enabled: false,
      },
      {
        key: 'approvals',
        name: 'Solicitudes con aprobación',
        description: 'Flujos con confirmación humana (evolución posterior al MVP).',
        category: 'Herramientas',
        status: 'Próximamente',
        initials: 'SA',
        enabled: false,
      },
    ]

    res.json({ integrations })
  })

  return router
}
