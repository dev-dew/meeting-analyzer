import { NextRequest, NextResponse } from 'next/server'
import { decodeSession } from '@/lib/session'

const PUBLIC_PATHS = ['/login', '/register']
const PUBLIC_API = ['/api/auth/login', '/api/auth/register']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Always allow static files, images, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) return NextResponse.next()

  // Allow public pages
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next()
  if (PUBLIC_API.some(p => pathname.startsWith(p))) return NextResponse.next()

  // Check session
  const token = req.cookies.get('meeting_session')?.value
  const session = token ? decodeSession(token) : null

  if (!session) {
    const loginUrl = new URL('/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
