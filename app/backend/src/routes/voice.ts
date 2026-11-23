import express, { Router, type RequestHandler } from 'express'
import type { Pool } from 'pg'
import { z } from 'zod'
import { logAuditEvent } from '../services/audit.js'
import {
  ALLOWED_VOICES,
  buildRealtimeInstructions,
  type AiProvider,
  type AuthorizedContext,
} from '../services/azure-ai.js'
import {
  assertConversationAndFolderOwnership,
  getUserPreferences,
  persistTurn,
} from '../services/chat.js'
import { getAuthorizedContext } from '../services/retrieval.js'
import type { CitationSource, DemoUser, EvidenceKind } from '../types.js'

const SpeakBodySchema = z.object({
  text: z.string().trim().min(1).max(2500),
  voice: z.enum(ALLOWED_VOICES).optional(),
  speed: z.number().min(0.75).max(1.5).optional(),
})

const RealtimeConnectSchema = z.object({
  sdp: z.string().min(10).max(150_000),
  voice: z.enum(ALLOWED_VOICES).optional(),
  speed: z.number().min(0.75).max(1.5).optional(),
  language: z.string().trim().max(20).optional(),
  sourceScope: z.enum(['all', 'policies', 'projects', 'profile']).optional(),
})

const RealtimeTurnSchema = z.object({
  conversationId: z.string().trim().min(1).optional(),
  folderId: z.string().trim().min(1).optional(),
  userText: z.string().trim().min(1).max(2000),
  assistantText: z.string().trim().min(1).max(4000),
})

function normalizeMatchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const NO_EVIDENCE_PATTERN =
  /\b(no encontr[eo]\s+evidencia|sin\s+evidencia|no\s+tengo\s+evidencia|no\s+existe\s+(una\s+)?politica|no\s+tienes\s+(acceso|permiso)|no\s+cuentas\s+con\s+(acceso|permiso)|no\s+cuento\s+con\s+(informacion|evidencia|acceso)|no\s+tengo\s+acceso\s+autorizado|acceso\s+restringido|no\s+hay\s+evidencia)\b/

function verifyRealtimeCitation(
  assistantText: string,
  user: DemoUser,
  authorizedContext: AuthorizedContext,
): { kind: EvidenceKind; source: CitationSource | null } {
  const normalized = normalizeMatchText(assistantText)

  if (NO_EVIDENCE_PATTERN.test(normalized)) {
    return { kind: 'none', source: null }
  }

  // 1. Check authorized policies (enforces 'outdated' if policy.current === false).
  for (const policy of authorizedContext.policies) {
    const titleNorm = normalizeMatchText(policy.title)
    const sectionNorm = normalizeMatchText(policy.section)
    const topicPhrase = normalizeMatchText(policy.topic.replace(/-/g, ' '))
    const topicWordRegex = new RegExp(`\\b${escapeRegExp(topicPhrase)}\\b`)

    if (
      normalized.includes(titleNorm) ||
      normalized.includes(sectionNorm) ||
      topicWordRegex.test(normalized)
    ) {
      return {
        kind: policy.current ? 'found' : 'outdated',
        source: {
          label: `${policy.title} · ${policy.section}`,
          to: `/politicas/${policy.topic}`,
        },
      }
    }
  }

  // 2. Check authorized projects ONLY (never cites unauthorized projects).
  // Strip assistant name "ST&T ATLAS" first so greetings never falsely cite project "Atlas".
  const withoutPersona = normalized.replace(/\bst\s*&?\s*t\s+atlas\b/g, ' ')
  const matchedProjects = authorizedContext.projects.filter((project) => {
    const nameNorm = normalizeMatchText(project.name)
    const idNorm = normalizeMatchText(project.id)
    const nameRegex = new RegExp(`\\b${escapeRegExp(nameNorm)}\\b`)
    const idRegex = new RegExp(`\\b${escapeRegExp(idNorm)}\\b`)
    return nameRegex.test(withoutPersona) || idRegex.test(withoutPersona)
  })

  if (matchedProjects.length > 1 && /[?¿]|\bcual\b|\bque proyecto\b/.test(normalized)) {
    return { kind: 'inference', source: null }
  }

  if (matchedProjects.length >= 1) {
    const matched = matchedProjects[0]
    return {
      kind: 'found',
      source: {
        label: `Ficha del proyecto ${matched.name}`,
        to: `/proyectos/${matched.id}`,
      },
    }
  }

  // 3. Check authorized user profile.
  if (authorizedContext.profile) {
    const emailNorm = normalizeMatchText(user.email)
    const roleNorm = normalizeMatchText(user.role)
    const areaNorm = normalizeMatchText(user.area)
    if (
      normalized.includes(emailNorm) ||
      /\b(tu perfil|perfil del colaborador|tus datos personales|tu correo corporativo)\b/.test(
        normalized,
      ) ||
      (normalized.includes(roleNorm) && normalized.includes(areaNorm))
    ) {
      return {
        kind: 'found',
        source: {
          label: `Perfil del colaborador · ${user.name}`,
          to: '/perfil',
        },
      }
    }
  }

  return { kind: 'none', source: null }
}

export function createVoiceRouter(
  pool: Pool,
  aiProvider: AiProvider,
  requireAuth: RequestHandler,
): Router {
  const router = Router()

  router.post(
    '/transcribe',
    requireAuth,
    express.raw({
      type: ['audio/*', 'video/webm', 'application/octet-stream'],
      limit: '10mb',
    }),
    async (req, res) => {
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        res.status(400).json({ error: 'No se recibió audio para transcribir.' })
        return
      }

      const mimeType =
        typeof req.headers['content-type'] === 'string'
          ? req.headers['content-type']
          : 'audio/webm'
      const language =
        typeof req.query.language === 'string'
          ? req.query.language.trim()
          : undefined

      const transcript = (
        await aiProvider.transcribeAudio(req.body, mimeType, language)
      ).trim()

      if (!transcript) {
        await logAuditEvent(pool, {
          eventType: 'voice_transcribe',
          actorLogin: req.user!.login,
          resource: 'voice:transcribe',
          outcome: 'empty',
          details: { bytes: req.body.length },
        })
        res.status(400).json({
          error:
            'No se detectó voz en la grabación. Intenta hablar más cerca del micrófono.',
        })
        return
      }

      await logAuditEvent(pool, {
        eventType: 'voice_transcribe',
        actorLogin: req.user!.login,
        resource: 'voice:transcribe',
        outcome: 'success',
        details: { bytes: req.body.length },
      })

      res.json({ text: transcript })
    },
  )

  router.post(
    '/speak',
    requireAuth,
    express.json({ limit: '100kb' }),
    async (req, res) => {
      const parsed = SpeakBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          error: 'Indica un texto válido para generar el audio.',
        })
        return
      }

      const audioBuffer = await aiProvider.synthesizeSpeech({
        text: parsed.data.text,
        voice: parsed.data.voice,
        speed: parsed.data.speed,
      })

      await logAuditEvent(pool, {
        eventType: 'voice_speak',
        actorLogin: req.user!.login,
        resource: 'voice:speak',
        outcome: 'success',
        details: {
          chars: parsed.data.text.length,
          voice:
            parsed.data.voice ??
            (aiProvider.isSpeechConfigured() ? 'es-CO-SalomeNeural' : 'coral'),
        },
      })

      res
        .status(200)
        .setHeader('Content-Type', 'audio/mpeg')
        .setHeader('Cache-Control', 'no-store')
        .send(audioBuffer)
    },
  )

  router.post(
    '/realtime/connect',
    requireAuth,
    express.json({ limit: '256kb' }),
    async (req, res) => {
      const parsed = RealtimeConnectSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          error: 'La oferta SDP de conexión en tiempo real no es válida.',
        })
        return
      }

      const user = req.user!
      const sourceScope = parsed.data.sourceScope ?? 'all'
      const preferences = await getUserPreferences(pool, user.login)
      const authorizedContext = await getAuthorizedContext(
        pool,
        aiProvider,
        user,
        '',
        preferences,
        sourceScope,
      )

      const instructions = buildRealtimeInstructions({
        user,
        authorizedContext,
        preferences,
      })

      const result = await aiProvider.createRealtimeCall({
        sdp: parsed.data.sdp,
        instructions,
        voice: parsed.data.voice,
        speed: parsed.data.speed,
        language: parsed.data.language,
      })

      await logAuditEvent(pool, {
        eventType: 'voice_realtime_connected',
        actorLogin: user.login,
        resource: 'voice:realtime',
        outcome: 'connected',
        details: {
          model: result.model,
          voice: result.voice,
          sourceScope,
        },
      })

      res.json({
        sdp: result.sdp,
        sessionId: result.sessionId,
        model: result.model,
        voice: result.voice,
      })
    },
  )

  router.post(
    '/realtime/turns',
    requireAuth,
    express.json({ limit: '100kb' }),
    async (req, res) => {
      const parsed = RealtimeTurnSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({
          error: 'Los datos del turno de conversación de voz no son válidos.',
        })
        return
      }

      const user = req.user!
      const { conversationId, folderId, userText, assistantText } = parsed.data

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
        '',
        preferences,
        'all',
      )

      const verified = verifyRealtimeCitation(
        assistantText,
        user,
        authorizedContext,
      )

      const persisted = await persistTurn(pool, {
        userLogin: user.login,
        conversationId,
        folderId,
        userText,
        assistantText,
        kind: verified.kind,
        source: verified.source,
        choices: [],
      })

      await logAuditEvent(pool, {
        eventType: 'voice_realtime_turn',
        actorLogin: user.login,
        resource: `conversation:${persisted.conversationId}`,
        outcome: verified.kind,
        details: {
          sourceTo: verified.source?.to ?? null,
        },
      })

      res.json(persisted)
    },
  )

  return router
}
