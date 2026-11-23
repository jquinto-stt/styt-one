import type { Pool } from 'pg'
import type { AiProvider, AuthorizedContext } from './azure-ai.js'
import type {
  DemoUser,
  PolicySummary,
  ProjectRecord,
  SourceScope,
  UserPreferences,
} from '../types.js'

export function toVectorLiteral(embedding: number[]): string {
  const values = embedding.map((n) => {
    if (!Number.isFinite(n)) {
      throw new Error('Invalid non-finite embedding value')
    }
    return Number(n).toFixed(8)
  })
  return `[${values.join(',')}]`
}

export function buildPolicyEmbeddingText(policy: {
  title: string
  category: string
  section: string
  summary: string
  body: string
}): string {
  return [policy.title, policy.category, policy.section, policy.summary, policy.body].join('\n')
}

export function buildProjectEmbeddingText(project: {
  name: string
  description: string
  owner: string
  status: string
  updated: string | null
}): string {
  return [
    `Proyecto ${project.name}`,
    project.description,
    `Responsable: ${project.owner}`,
    `Estado: ${project.status}`,
    `Actualización: ${project.updated ?? 'Sin documentar'}`,
  ].join('\n')
}

export async function embedPolicyVersion(
  pool: Pool,
  aiProvider: AiProvider,
  versionId: number,
  text: string,
): Promise<void> {
  const embedding = await aiProvider.createEmbedding(text)
  if (!embedding) return
  await pool.query(
    `UPDATE policy_versions SET embedding = $1::vector WHERE id = $2`,
    [toVectorLiteral(embedding), versionId],
  )
}

export async function embedProject(
  pool: Pool,
  aiProvider: AiProvider,
  projectId: string,
  text: string,
): Promise<void> {
  const embedding = await aiProvider.createEmbedding(text)
  if (!embedding) return
  await pool.query(
    `UPDATE projects SET embedding = $1::vector WHERE id = $2`,
    [toVectorLiteral(embedding), projectId],
  )
}

export async function syncEmbeddings(
  pool: Pool,
  aiProvider: AiProvider,
): Promise<void> {
  if (!aiProvider.isConfigured()) return

  const missingPolicies = await pool.query<{
    id: number
    title: string
    category: string
    section: string
    summary: string
    body: string
  }>(`
    SELECT pv.id, p.title, p.category, pv.section, pv.summary, pv.body
    FROM policy_versions pv
    JOIN policies p ON p.topic = pv.topic
    WHERE pv.embedding IS NULL
  `)

  for (const row of missingPolicies.rows) {
    await embedPolicyVersion(pool, aiProvider, row.id, buildPolicyEmbeddingText(row))
  }

  const missingProjects = await pool.query<{
    id: string
    name: string
    description: string
    owner: string
    status: string
    updated: string | null
  }>(`
    SELECT id, name, description, owner, status, updated
    FROM projects
    WHERE embedding IS NULL
  `)

  for (const row of missingProjects.rows) {
    await embedProject(pool, aiProvider, row.id, buildProjectEmbeddingText(row))
  }
}

interface PolicyRow {
  topic: string
  title: string
  category: string
  section: string
  version: number
  current: boolean
  updated: string
  summary: string
  body: string
}

interface ProjectRow {
  id: string
  name: string
  description: string
  owner: string
  status: string
  updated: string | null
  members: string[]
}

export async function getAuthorizedContext(
  pool: Pool,
  aiProvider: AiProvider,
  user: DemoUser,
  question: string,
  preferences: UserPreferences,
  sourceScope: SourceScope = 'all',
): Promise<AuthorizedContext> {
  const includeProfile =
    preferences.connectedApps.profile &&
    (sourceScope === 'all' || sourceScope === 'profile')
  const includeProjects =
    preferences.connectedApps.projects &&
    (sourceScope === 'all' || sourceScope === 'projects')
  const includePolicies =
    preferences.connectedApps.policies &&
    (sourceScope === 'all' || sourceScope === 'policies')

  const queryEmbedding =
    (includePolicies || includeProjects) && question.trim().length > 0
      ? await aiProvider.createEmbedding(question)
      : null
  const vectorParam = queryEmbedding ? toVectorLiteral(queryEmbedding) : null

  let policies: PolicySummary[] = []
  if (includePolicies) {
    const policyResult = vectorParam
      ? await pool.query<PolicyRow>(
          `
          WITH latest_policies AS (
            SELECT DISTINCT ON (pv.topic)
              p.topic,
              p.title,
              p.category,
              pv.section,
              pv.version,
              pv.current,
              pv.updated,
              pv.summary,
              pv.body,
              pv.embedding
            FROM policy_versions pv
            JOIN policies p ON p.topic = pv.topic
            ORDER BY pv.topic, pv.version DESC
          )
          SELECT topic, title, category, section, version, current, updated, summary, body
          FROM latest_policies
          ORDER BY
            CASE WHEN embedding IS NOT NULL THEN embedding <=> $1::vector ELSE 1.0 END ASC,
            title ASC
          `,
          [vectorParam],
        )
      : await pool.query<PolicyRow>(`
          SELECT DISTINCT ON (pv.topic)
            p.topic,
            p.title,
            p.category,
            pv.section,
            pv.version,
            pv.current,
            pv.updated,
            pv.summary,
            pv.body
          FROM policy_versions pv
          JOIN policies p ON p.topic = pv.topic
          ORDER BY pv.topic, pv.version DESC
        `)

    policies = policyResult.rows.map((row) => ({
      topic: row.topic,
      title: row.title,
      category: row.category,
      section: row.section,
      version: row.version,
      current: row.current,
      updated: row.updated,
      summary: row.summary,
      body: row.body,
    }))
  }

  let projects: ProjectRecord[] = []
  if (includeProjects) {
    const isAdmin = user.role === 'Administrador'
    let projectResult

    if (isAdmin && vectorParam) {
      projectResult = await pool.query<ProjectRow>(
        `
        SELECT
          p.id,
          p.name,
          p.description,
          p.owner,
          p.status,
          p.updated,
          COALESCE(
            ARRAY_AGG(u.name ORDER BY u.name) FILTER (WHERE u.name IS NOT NULL),
            ARRAY[]::text[]
          ) AS members
        FROM projects p
        LEFT JOIN project_members pm ON pm.project_id = p.id
        LEFT JOIN users u ON u.login = pm.user_login
        GROUP BY p.id
        ORDER BY
          CASE WHEN p.embedding IS NOT NULL THEN p.embedding <=> $1::vector ELSE 1.0 END ASC,
          p.name ASC
        `,
        [vectorParam],
      )
    } else if (isAdmin) {
      projectResult = await pool.query<ProjectRow>(`
        SELECT
          p.id,
          p.name,
          p.description,
          p.owner,
          p.status,
          p.updated,
          COALESCE(
            ARRAY_AGG(u.name ORDER BY u.name) FILTER (WHERE u.name IS NOT NULL),
            ARRAY[]::text[]
          ) AS members
        FROM projects p
        LEFT JOIN project_members pm ON pm.project_id = p.id
        LEFT JOIN users u ON u.login = pm.user_login
        GROUP BY p.id
        ORDER BY p.name ASC
      `)
    } else if (vectorParam) {
      projectResult = await pool.query<ProjectRow>(
        `
        SELECT
          p.id,
          p.name,
          p.description,
          p.owner,
          p.status,
          p.updated,
          COALESCE(
            ARRAY_AGG(u.name ORDER BY u.name) FILTER (WHERE u.name IS NOT NULL),
            ARRAY[]::text[]
          ) AS members
        FROM projects p
        LEFT JOIN project_members pm ON pm.project_id = p.id
        LEFT JOIN users u ON u.login = pm.user_login
        WHERE EXISTS (
          SELECT 1
          FROM project_members auth_pm
          WHERE auth_pm.project_id = p.id
            AND auth_pm.user_login = $1
        )
        GROUP BY p.id
        ORDER BY
          CASE WHEN p.embedding IS NOT NULL THEN p.embedding <=> $2::vector ELSE 1.0 END ASC,
          p.name ASC
        `,
        [user.login, vectorParam],
      )
    } else {
      projectResult = await pool.query<ProjectRow>(
        `
        SELECT
          p.id,
          p.name,
          p.description,
          p.owner,
          p.status,
          p.updated,
          COALESCE(
            ARRAY_AGG(u.name ORDER BY u.name) FILTER (WHERE u.name IS NOT NULL),
            ARRAY[]::text[]
          ) AS members
        FROM projects p
        LEFT JOIN project_members pm ON pm.project_id = p.id
        LEFT JOIN users u ON u.login = pm.user_login
        WHERE EXISTS (
          SELECT 1
          FROM project_members auth_pm
          WHERE auth_pm.project_id = p.id
            AND auth_pm.user_login = $1
        )
        GROUP BY p.id
        ORDER BY p.name ASC
        `,
        [user.login],
      )
    }

    projects = projectResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      owner: row.owner,
      status: row.status,
      updated: row.updated,
      members: row.members,
    }))
  }

  return {
    profile: includeProfile ? user : null,
    projects,
    policies,
  }
}
