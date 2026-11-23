import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'

export class HttpError extends Error {
  readonly status: number
  readonly code?: string

  constructor(status: number, message: string, code?: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.code = code
  }
}

export class AiServiceError extends HttpError {
  constructor(
    message = 'El asistente de IA no está disponible en este momento. Intenta de nuevo en unos segundos.',
  ) {
    super(503, message, 'AI_UNAVAILABLE')
    this.name = 'AiServiceError'
  }
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value)
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: err.message,
      ...(err.code ? { code: err.code } : {}),
    })
    return
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Los datos enviados no son válidos.',
    })
    return
  }

  if (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    (err as { type?: string }).type === 'entity.too.large'
  ) {
    res.status(413).json({
      error: 'El archivo o contenido enviado supera el tamaño máximo permitido.',
    })
    return
  }

  if (
    err instanceof SyntaxError &&
    'status' in err &&
    (err as { status?: number }).status === 400
  ) {
    res.status(400).json({
      error: 'El cuerpo JSON de la solicitud no es válido.',
    })
    return
  }

  console.error('[backend] Unhandled error:', err instanceof Error ? err.message : 'Unknown error')
  res.status(500).json({
    error: 'Ocurrió un error interno al procesar la solicitud.',
  })
}
