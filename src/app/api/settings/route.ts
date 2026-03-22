export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, setSessionCookie } from '@/lib/session'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })

    // System config from env (masked)
    const config = {
      groqApiKey:       process.env.GROQ_API_KEY       ? '••••••••' + process.env.GROQ_API_KEY.slice(-4) : '',
      assemblyAiKey:    process.env.ASSEMBLYAI_API_KEY  ? '••••••••' + process.env.ASSEMBLYAI_API_KEY.slice(-4) : '',
      resendApiKey:     process.env.RESEND_API_KEY      ? '••••••••' + process.env.RESEND_API_KEY.slice(-4) : '',
      emailFrom:        process.env.EMAIL_FROM          || '',
      adminEmail:       process.env.ADMIN_EMAIL         || '',
      appUrl:           process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      hasGroq:          !!process.env.GROQ_API_KEY,
      hasAssemblyAi:    !!process.env.ASSEMBLYAI_API_KEY,
      hasResend:        !!process.env.RESEND_API_KEY,
    }

    // Stats for profile
    const meetingCount = await prisma.meeting.count({ where: { createdBy: session.id } })
    const totalMeetings = await prisma.meeting.count()
    const userCount = await prisma.user.count()

    return NextResponse.json({ user, config, stats: { meetingCount, totalMeetings, userCount } })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { type } = body

    // ── Update Profile ──────────────────────────────────────────
    if (type === 'profile') {
      const { name, email } = body
      if (!name?.trim() || !email?.trim()) {
        return NextResponse.json({ error: 'กรุณากรอกชื่อและอีเมล' }, { status: 400 })
      }

      // Check email conflict
      const conflict = await prisma.user.findFirst({
        where: { email, NOT: { id: session.id } },
      })
      if (conflict) return NextResponse.json({ error: 'อีเมลนี้มีผู้ใช้แล้ว' }, { status: 400 })

      const user = await prisma.user.update({
        where: { id: session.id },
        data: { name: name.trim(), email: email.trim() },
        select: { id: true, name: true, email: true, role: true },
      })

      // Update session cookie
      const res = NextResponse.json({ success: true, user })
      res.cookies.set(setSessionCookie(user))
      return res
    }

    // ── Change Password ─────────────────────────────────────────
    if (type === 'password') {
      const { currentPassword, newPassword } = body
      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: 'กรุณากรอกรหัสผ่านให้ครบ' }, { status: 400 })
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัว' }, { status: 400 })
      }

      const user = await prisma.user.findUnique({ where: { id: session.id } })
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

      const valid = await bcrypt.compare(currentPassword, user.password)
      if (!valid) return NextResponse.json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }, { status: 400 })

      const hashed = await bcrypt.hash(newPassword, 12)
      await prisma.user.update({ where: { id: session.id }, data: { password: hashed } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
