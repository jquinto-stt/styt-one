import type { Pool } from 'pg'
import { HttpError, isValidUuid } from '../lib/errors.js'
import { logAuditEvent } from './audit.js'
import type { AiProvider, AuthorizedContext, ConversationTurn } from './azure-ai.js'
import { getAuthorizedContext } from './retrieval.js'
import type {
  ChatMessageRecord,
  CitationSource,
  ConnectedAppsConfig,
  DemoUser,
  EvidenceKind,
  SourceScope,
  UserPreferences,
} from '../types.js'

export interface ChatRequestInput {
  user: DemoUser
  message: string
  conversationId?: string
  folderId?: string
  sourceScope?: SourceScope
  voiceMode?: boolean
}

export interface ChatResponsePayload {
  conversationId: string
  userMessage: ChatMessageRecord
  assistantMessage: ChatMessageRecord
}

interface PreferencesRow {
  detail_level: string
  tone: string
  always_show_source: boolean
  suggest_related: boolean
  additional_context: string
  connected_apps: Partial<ConnectedAppsConfig> | null
  updated_at: Date
}

interface MessageRow {
  id: string
  conversation_id: string
  sender: 'user' | 'assistant'
  text: string
  kind: EvidenceKind | null
  source_label: string | null
  source_to: string | null
  choices: unknown
  created_at: Date
}

const BLOCKED_PROMPT_REPLY =
  'No puedo procesar esta solicitud porque contiene instrucciones que incumplen las políticas de seguridad de ST&T One. Formula tu consulta a ST&T ATLAS sobre políticas corporativas, proyectos autorizados o tu perfil.'

export async function getUserPreferences(
  pool: Pool,
  userLogin: string,
): Promise<UserPreferences> {
  const result = await pool.query<PreferencesRow>(
    `
    SELECT
      detail_level,
      tone,
      always_show_source,
      suggest_related,
      additional_context,
      connected_apps,
      updated_at
    FROM user_preferences
    WHERE user_login = $1
    LIMIT 1
    `,
    [userLogin],
  )

  const row = result.rows[0]
  if (!row) {
    return {
      detailLevel: 'Equilibrado',
      tone: 'Profesional y claro',
      alwaysShowSource: true,
      suggestRelated: true,
      additionalContext: '',
      connectedApps: { policies: true, projects: true, profile: true },
      updatedAt: new Date().toISOString(),
    }
  }

  const apps = row.connected_apps ?? {}
  return {
    detailLevel: row.detail_level,
    tone: row.tone,
    alwaysShowSource: row.always_show_source,
    suggestRelated: row.suggest_related,
    additionalContext: row.additional_context,
    connectedApps: {
      policies: apps.policies !== false,
      projects: apps.projects !== false,
      profile: apps.profile !== false,
    },
    updatedAt: row.updated_at.toISOString(),
  }
}

export function mapMessageRow(row: MessageRow): ChatMessageRecord {
  const choices = Array.isArray(row.choices)
    ? row.choices.filter((c): c is string => typeof c === 'string')
    : []

  return {
    id: row.id,
    conversationId: row.conversation_id,
    sender: row.sender,
    text: row.text,
    kind: row.kind,
    source:
      row.source_label && row.source_to
        ? { label: row.source_label, to: row.source_to }
        : null,
    choices,
    createdAt: row.created_at.toISOString(),
  }
}

function buildConversationTitle(message: string): string {
  const compact = message.replace(/\s+/g, ' ').trim()
  if (compact.length <= 60) return compact
  return `${compact.slice(0, 57).trimEnd()}...`
}

function postValidateModelOutput(
  raw: {
    text: string
    kind: EvidenceKind
    sourceType: 'policy' | 'project' | 'profile' | 'none'
    sourceId: string | null
    choices: string[]
  },
  authorizedContext: AuthorizedContext,
  user: DemoUser,
  preferences: UserPreferences,
): {
  text: string
  kind: EvidenceKind
  source: CitationSource | null
  choices: string[]
} {
  let kind: EvidenceKind = raw.kind
  let source: CitationSource | null = null

  if (raw.sourceType === 'policy' && raw.sourceId) {
    const matchedPolicy = authorizedContext.policies.find(
      (p) => p.topic === raw.sourceId,
    )
    if (matchedPolicy) {
      source = {
        label: `${matchedPolicy.title} · ${matchedPolicy.section}`,
        to: `/politicas/${matchedPolicy.topic}`,
      }
      if (!matchedPolicy.current) {
        kind = 'outdated'
      }
    }
  } else if (raw.sourceType === 'project' && raw.sourceId) {
    const matchedProject = authorizedContext.projects.find(
      (p) => p.id === raw.sourceId,
    )
    if (matchedProject) {
      source = {
        label: `Ficha del proyecto ${matchedProject.name}`,
        to: `/proyectos/${matchedProject.id}`,
      }
    }
  } else if (raw.sourceType === 'profile' && authorizedContext.profile !== null) {
    source = {
      label: `Perfil del colaborador · ${user.name}`,
      to: '/perfil',
    }
  }

  const sanitizedChoices = raw.choices
    .map((choice) => choice.trim().slice(0, 80))
    .filter((choice) => choice.length > 0)
    .slice(0, 4)

  const finalChoices =
    !preferences.suggestRelated && kind !== 'inference' ? [] : sanitizedChoices

  return {
    text: raw.text.trim(),
    kind,
    source,
    choices: finalChoices,
  }
}

export async function assertConversationAndFolderOwnership(
  pool: Pool,
  userLogin: string,
  conversationId?: string,
  folderId?: string,
): Promise<void> {
  if (conversationId) {
    if (!isValidUuid(conversationId)) {
      throw new HttpError(400, 'El identificador de conversación no es válido.')
    }
    const convCheck = await pool.query<{ user_login: string }>(
      `SELECT user_login FROM conversations WHERE id = $1 LIMIT 1`,
      [conversationId],
    )
    if (!convCheck.rows[0]) {
      throw new HttpError(404, 'Conversación no encontrada.')
    }
    if (convCheck.rows[0].user_login !== userLogin) {
      await logAuditEvent(pool, {
        eventType: 'conversation_access_denied',
        actorLogin: userLogin,
        resource: `conversation:${conversationId}`,
        outcome: 'denied',
      })
      throw new HttpError(403, 'No tienes permiso para acceder a esta conversación.')
    }
  }

  if (folderId) {
    if (!isValidUuid(folderId)) {
      throw new HttpError(400, 'El identificador de carpeta no es válido.')
    }
    const folderCheck = await pool.query<{ user_login: string }>(
      `SELECT user_login FROM folders WHERE id = $1 LIMIT 1`,
      [folderId],
    )
    if (!folderCheck.rows[0]) {
      throw new HttpError(404, 'Carpeta no encontrada.')
    }
    if (folderCheck.rows[0].user_login !== userLogin) {
      throw new HttpError(403, 'No tienes permiso para usar esta carpeta.')
    }
  }
}

export async function persistTurn(
  pool: Pool,
  params: {
    userLogin: string
    conversationId?: string
    folderId?: string
    userText: string
    assistantText: string
    kind: EvidenceKind
    source: CitationSource | null
    choices: string[]
  },
): Promise<ChatResponsePayload> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    let convId = params.conversationId
    if (!convId) {
      const convResult = await client.query<{ id: string }>(
        `
        INSERT INTO conversations (user_login, title, folder_id)
        VALUES ($1, $2, $3)
        RETURNING id
        `,
        [
          params.userLogin,
          buildConversationTitle(params.userText),
          params.folderId ?? null,
        ],
      )
      convId = convResult.rows[0].id
    } else {
      await client.query(
        `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
        [convId],
      )
    }

    const userMsgResult = await client.query<MessageRow>(
      `
      INSERT INTO messages (conversation_id, sender, text, kind, source_label, source_to, choices)
      VALUES ($1, 'user', $2, NULL, NULL, NULL, '[]'::jsonb)
      RETURNING id, conversation_id, sender, text, kind, source_label, source_to, choices, created_at
      `,
      [convId, params.userText],
    )

    const assistantMsgResult = await client.query<MessageRow>(
      `
      INSERT INTO messages (conversation_id, sender, text, kind, source_label, source_to, choices)
      VALUES ($1, 'assistant', $2, $3, $4, $5, $6::jsonb)
      RETURNING id, conversation_id, sender, text, kind, source_label, source_to, choices, created_at
      `,
      [
        convId,
        params.assistantText,
        params.kind,
        params.source?.label ?? null,
        params.source?.to ?? null,
        JSON.stringify(params.choices),
      ],
    )

    await client.query('COMMIT')

    return {
      conversationId: convId,
      userMessage: mapMessageRow(userMsgResult.rows[0]),
      assistantMessage: mapMessageRow(assistantMsgResult.rows[0]),
    }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function handleChatRequest(
  pool: Pool,
  aiProvider: AiProvider,
  input: ChatRequestInput,
): Promise<ChatResponsePayload> {
  const {
    user,
    message,
    conversationId,
    folderId,
    sourceScope = 'all',
    voiceMode = false,
  } = input

  await assertConversationAndFolderOwnership(
    pool,
    user.login,
    conversationId,
    folderId,
  )

  const preferences = await getUserPreferences(pool, user.login)
  const authorizedContext = await getAuthorizedContext(
    pool,
    aiProvider,
    user,
    message,
    preferences,
    sourceScope,
  )

  const retrievedDocTexts: string[] = [
    ...authorizedContext.policies.map(
      (p) => `${p.title} (${p.section}): ${p.summary}\n${p.body}`,
    ),
    ...authorizedContext.projects.map(
      (p) => `${p.name}: ${p.description} (${p.status})`,
    ),
  ]

  const shieldResult = await aiProvider.screenPrompt(message, retrievedDocTexts)
  if (shieldResult.blocked) {
    const persisted = await persistTurn(pool, {
      userLogin: user.login,
      conversationId,
      folderId,
      userText: message,
      assistantText: BLOCKED_PROMPT_REPLY,
      kind: 'none',
      source: null,
      choices: [],
    })

    await logAuditEvent(pool, {
      eventType: 'prompt_shield_blocked',
      actorLogin: user.login,
      resource: `conversation:${persisted.conversationId}`,
      outcome: 'blocked',
      details: { reason: shieldResult.reason ?? 'attack_detected' },
    })

    return persisted
  }

  let history: ConversationTurn[] = []
  if (conversationId) {
    const historyResult = await pool.query<{
      sender: 'user' | 'assistant'
      text: string
    }>(
      `
      SELECT sender, text
      FROM (
        SELECT sender, text, created_at
        FROM messages
        WHERE conversation_id = $1
        ORDER BY created_at DESC
        LIMIT 6
      ) recent
      ORDER BY created_at ASC
      `,
      [conversationId],
    )
    history = historyResult.rows
  }

  let rawAnswer
  try {
    rawAnswer = await aiProvider.generateGroundedAnswer({
      user,
      question: message,
      authorizedContext,
      preferences,
      history,
      voiceMode,
    })
  } catch (err) {
    await logAuditEvent(pool, {
      eventType: 'chat_ai_error',
      actorLogin: user.login,
      resource: conversationId ? `conversation:${conversationId}` : 'chat:new',
      outcome: 'error',
      details: {
        errorType: err instanceof Error ? err.name : 'UnknownError',
      },
    })
    throw err
  }

  const validated = postValidateModelOutput(
    rawAnswer,
    authorizedContext,
    user,
    preferences,
  )

  const persisted = await persistTurn(pool, {
    userLogin: user.login,
    conversationId,
    folderId,
    userText: message,
    assistantText: validated.text,
    kind: validated.kind,
    source: validated.source,
    choices: validated.choices,
  })

  await logAuditEvent(pool, {
    eventType: 'chat_query',
    actorLogin: user.login,
    resource: `conversation:${persisted.conversationId}`,
    outcome: validated.kind,
    details: {
      sourceTo: validated.source?.to ?? null,
      sourceScope,
      voiceMode,
    },
  })

  return persisted
}
