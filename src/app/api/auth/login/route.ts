import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { setSessionCookie } from '@/lib/session'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const { email, password } = Schema.parse(await req.json())
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 })
    }
    const sessionUser = { id: user.id, name: user.name, email: user.email, role: user.role }
    const res = NextResponse.json({ success: true, user: sessionUser })
    res.cookies.set(setSessionCookie(sessionUser))
    return res
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
