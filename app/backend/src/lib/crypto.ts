import crypto from 'node:crypto'

const SCRYPT_KEY_LENGTH = 64

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH).toString('hex')
  return `${salt}:${derivedKey}`
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':')
  if (parts.length !== 2) return false
  const [salt, expectedHex] = parts
  if (!salt || !expectedHex) return false

  try {
    const expectedBuffer = Buffer.from(expectedHex, 'hex')
    const actualBuffer = crypto.scryptSync(password, salt, expectedBuffer.length)
    if (actualBuffer.length !== expectedBuffer.length) return false
    return crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  } catch {
    return false
  }
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}
