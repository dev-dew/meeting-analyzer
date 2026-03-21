import { NextResponse } from 'next/server'
import { SESSION_COOKIE_NAME } from '@/lib/session'

export async function POST() {
  const res = NextResponse.json({ success: true })
  res.cookies.set({ name: SESSION_COOKIE_NAME, value: '', maxAge: 0, path: '/' })
  return res
}
