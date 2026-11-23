import type { Pool } from 'pg'
import { hashPassword } from '../lib/crypto.js'

export const DEMO_PASSWORD = 'Demo-One-2026'

interface SeedUser {
  login: string
  name: string
  initials: string
  email: string
  role: 'Colaborador' | 'Líder de proyecto' | 'Administrador'
  area: string
}

interface SeedPolicy {
  topic: string
  title: string
  category: string
  version: number
  section: string
  current: boolean
  updated: string
  summary: string
  body: string
}

interface SeedProject {
  id: string
  name: string
  description: string
  owner: string
  status: string
  updated: string | null
  members: string[]
}

const SEED_USERS: SeedUser[] = [
  {
    login: 'colaborador',
    name: 'Ana Torres',
    initials: 'AT',
    email: 'ana.torres@demo.stt',
    role: 'Colaborador',
    area: 'Desarrollo',
  },
  {
    login: 'lider',
    name: 'Luis Vega',
    initials: 'LV',
    email: 'luis.vega@demo.stt',
    role: 'Líder de proyecto',
    area: 'Proyectos',
  },
  {
    login: 'admin',
    name: 'Sara Mora',
    initials: 'SM',
    email: 'sara.mora@demo.stt',
    role: 'Administrador',
    area: 'Operaciones',
  },
]

const SEED_POLICIES: SeedPolicy[] = [
  {
    topic: 'vacaciones',
    title: 'Política de vacaciones',
    category: 'Talento humano',
    version: 3,
    section: 'Solicitud de vacaciones',
    current: true,
    updated: '2026-09-15',
    summary:
      'Envía la solicitud con 15 días hábiles de anticipación a través del portal de Talento Humano y solicita aprobación de tu líder.',
    body: [
      'Procedimiento vigente para solicitar vacaciones en ST&T:',
      '1. Verifica tu saldo de días disponibles en el portal de Talento Humano antes de definir fechas.',
      '2. Registra la solicitud con al menos 15 días hábiles de anticipación a la fecha de inicio deseada.',
      '3. Selecciona las fechas de salida y retorno y asigna la solicitud para aprobación directa de tu líder de proyecto o jefe inmediato.',
      '4. Una vez aprobada por tu líder, Talento Humano valida el saldo y emite la confirmación formal por correo corporativo.',
      '5. Coordina la entrega temporal de pendientes con tu equipo antes del inicio del descanso.',
    ].join('\n'),
  },
  {
    topic: 'viaticos',
    title: 'Política de viáticos',
    category: 'Finanzas',
    version: 1,
    section: 'Reembolso de gastos de viaje',
    current: false,
    updated: '2024-02-01',
    summary:
      'Documento en revisión. Los topes y soportes requeridos están pendientes de actualización por Finanzas.',
    body: [
      'AVISO: Este documento no se encuentra vigente y está en proceso de revisión por el área de Finanzas.',
      '1. Los topes diarios de alimentación, hospedaje y transporte de la versión 1 se encuentran suspendidos hasta nueva publicación.',
      '2. Antes de realizar cualquier viaje corporativo o incurrir en gastos reembolsables, confirma las tarifas vigentes y soportes fiscales requeridos directamente con Finanzas.',
      '3. No asumas la aprobación automática de reembolsos con base en esta versión vencida.',
    ].join('\n'),
  },
  {
    topic: 'trabajo-remoto',
    title: 'Lineamientos de trabajo remoto',
    category: 'Talento humano',
    version: 2,
    section: 'Disponibilidad y herramientas',
    current: true,
    updated: '2026-06-03',
    summary:
      'Horario núcleo de coordinación, canales oficiales de comunicación y uso de equipos corporativos.',
    body: [
      'Lineamientos vigentes para la modalidad de trabajo remoto en ST&T:',
      '1. Horario núcleo de coordinación: mantén disponibilidad activa entre las 09:00 y las 16:00 (hora local) para reuniones de seguimiento y coordinación con el equipo.',
      '2. Canales oficiales: utiliza exclusivamente el correo corporativo y las plataformas de mensajería y videoconferencia autorizadas por ST&T.',
      '3. Equipos corporativos: accede a repositorios, documentos y sistemas internos únicamente desde el equipo asignado por la empresa y mediante conexión segura.',
      '4. Reporta de inmediato cualquier incidente técnico o de conectividad a tu líder y al equipo de soporte interno.',
    ].join('\n'),
  },
  {
    topic: 'seguridad',
    title: 'Uso seguro de la información',
    category: 'Seguridad',
    version: 4,
    section: 'Clasificación de documentos',
    current: true,
    updated: '2026-08-20',
    summary:
      'Clasificación interna, restringida y confidencial. No compartir información corporativa en herramientas no autorizadas.',
    body: [
      'Clasificación obligatoria y manejo de documentos corporativos:',
      '1. Información interna: disponible para colaboradores de ST&T; no debe publicarse fuera de los canales institucionales.',
      '2. Información restringida: limitada exclusivamente a los miembros autorizados de un proyecto o área específica.',
      '3. Información confidencial: datos sensibles de negocio, clientes o personal; requiere autorización explícita y almacenamiento cifrado.',
      '4. Prohibición de herramientas no autorizadas: está prohibido copiar, subir o procesar documentos corporativos o datos de clientes en servicios externos o herramientas de IA no aprobadas por ST&T.',
    ].join('\n'),
  },
]

const SEED_PROJECTS: SeedProject[] = [
  {
    id: 'atlas',
    name: 'Atlas',
    description:
      'Proyecto de muestra para la demostración. Su ficha es el documento fuente del proyecto.',
    owner: 'Luis Vega',
    status: 'En ejecución',
    updated: '2026-10-30',
    members: ['colaborador', 'lider', 'admin'],
  },
  {
    id: 'faro',
    name: 'Faro',
    description: 'Proyecto de muestra con acceso restringido a sus miembros.',
    owner: 'Luis Vega',
    status: 'En planeación',
    updated: null,
    members: ['lider', 'admin'],
  },
]

const DEFAULT_FOLDERS = ['Talento humano', 'Proyectos', 'Mi información']

const DEFAULT_CONNECTED_APPS = {
  policies: true,
  projects: true,
  profile: true,
}

/**
 * Seeds initial demo data idempotently.
 * Never overwrites existing policies, policy versions, projects, folders, or preferences
 * so administrative and user changes survive server restarts.
 */
export async function seedDatabase(pool: Pool): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    for (const user of SEED_USERS) {
      const passwordHash = hashPassword(DEMO_PASSWORD)
      await client.query(
        `
        INSERT INTO users (login, name, initials, email, role, area, password_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (login) DO NOTHING
        `,
        [
          user.login,
          user.name,
          user.initials,
          user.email,
          user.role,
          user.area,
          passwordHash,
        ],
      )

      await client.query(
        `
        INSERT INTO user_preferences (
          user_login,
          detail_level,
          tone,
          always_show_source,
          suggest_related,
          additional_context,
          connected_apps
        )
        VALUES ($1, 'Equilibrado', 'Profesional y claro', TRUE, TRUE, '', $2::jsonb)
        ON CONFLICT (user_login) DO NOTHING
        `,
        [user.login, JSON.stringify(DEFAULT_CONNECTED_APPS)],
      )

      for (const [index, folderName] of DEFAULT_FOLDERS.entries()) {
        await client.query(
          `
          INSERT INTO folders (user_login, name, created_at)
          VALUES ($1, $2, NOW() + make_interval(secs => $3::double precision))
          ON CONFLICT (user_login, name) DO NOTHING
          `,
          [user.login, folderName, index * 0.001],
        )
      }
    }

    for (const policy of SEED_POLICIES) {
      await client.query(
        `
        INSERT INTO policies (topic, title, category)
        VALUES ($1, $2, $3)
        ON CONFLICT (topic) DO NOTHING
        `,
        [policy.topic, policy.title, policy.category],
      )

      const existingVersions = await client.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM policy_versions WHERE topic = $1`,
        [policy.topic],
      )

      if (Number(existingVersions.rows[0]?.count ?? 0) === 0) {
        await client.query(
          `
          INSERT INTO policy_versions (
            topic, version, section, current, updated, summary, body, created_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'admin')
          ON CONFLICT (topic, version) DO NOTHING
          `,
          [
            policy.topic,
            policy.version,
            policy.section,
            policy.current,
            policy.updated,
            policy.summary,
            policy.body,
          ],
        )
      }
    }

    for (const project of SEED_PROJECTS) {
      const inserted = await client.query(
        `
        INSERT INTO projects (id, name, description, owner, status, updated)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
        RETURNING id
        `,
        [
          project.id,
          project.name,
          project.description,
          project.owner,
          project.status,
          project.updated,
        ],
      )

      if (inserted.rowCount && inserted.rowCount > 0) {
        for (const memberLogin of project.members) {
          await client.query(
            `
            INSERT INTO project_members (project_id, user_login)
            VALUES ($1, $2)
            ON CONFLICT (project_id, user_login) DO NOTHING
            `,
            [project.id, memberLogin],
          )
        }
      }
    }

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
