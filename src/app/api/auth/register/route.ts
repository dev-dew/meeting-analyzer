import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { setSessionCookie } from '@/lib/session'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const Schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = Schema.parse(await req.json())
    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) return NextResponse.json({ error: 'อีเมลนี้มีในระบบแล้ว' }, { status: 400 })
    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({ data: { name, email, password: hashed, role: 'member' } })
    const sessionUser = { id: user.id, name: user.name, email: user.email, role: user.role }
    const res = NextResponse.json({ success: true, user: sessionUser })
    res.cookies.set(setSessionCookie(sessionUser))
    return res
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
