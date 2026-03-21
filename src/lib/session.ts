import { cookies } from 'next/headers'

export interface SessionUser {
  id: string
  name: string
  email: string
  role: string
}

const SESSION_KEY = 'meeting_session'
const SECRET = process.env.SESSION_SECRET || 'fallback-secret-change-in-production'

function base64url(str: string) {
  return Buffer.from(str).toString('base64url')
}
function fromBase64url(str: string) {
  return Buffer.from(str, 'base64url').toString('utf8')
}

export function encodeSession(user: SessionUser): string {
  const payload = JSON.stringify({ ...user, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })
  const sig = base64url(SECRET + payload)
  return base64url(payload) + '.' + sig
}

export function decodeSession(token: string): SessionUser | null {
  try {
    const [payloadB64, sig] = token.split('.')
    const payload = fromBase64url(payloadB64)
    const expectedSig = base64url(SECRET + payload)
    if (sig !== expectedSig) return null
    const data = JSON.parse(payload)
    if (data.exp < Date.now()) return null
    return { id: data.id, name: data.name, email: data.email, role: data.role }
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_KEY)?.value
  if (!token) return null
  return decodeSession(token)
}

export function setSessionCookie(user: SessionUser) {
  const token = encodeSession(user)
  return {
    name: SESSION_KEY,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  }
}

export const SESSION_COOKIE_NAME = SESSION_KEY
