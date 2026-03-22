export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWeeklyDigest } from '@/lib/email'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const session = await getSession()
    if (!session && body.secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const recipientEmail = body.email || process.env.ADMIN_EMAIL || session?.email
    if (!recipientEmail) return NextResponse.json({ error: 'No recipient email' }, { status: 400 })

    const since = new Date()
    since.setDate(since.getDate() - 7)
    const meetings = await prisma.meeting.findMany({
      where: { meetingDate: { gte: since } },
      orderBy: { meetingDate: 'desc' },
      select: {
        id: true, title: true, meetingType: true, meetingDate: true,
        meetingScore: true, salesScore: true, riskLevel: true, sentimentOverall: true,
      },
    })

    if (meetings.length === 0) return NextResponse.json({ message: 'No meetings this week' })
    await sendWeeklyDigest(meetings, recipientEmail)
    return NextResponse.json({ success: true, sent: meetings.length, to: recipientEmail })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { id: session.id }, select: { email: true } })
  if (!user?.email) return NextResponse.json({ error: 'No email' }, { status: 400 })
  const since = new Date()
  since.setDate(since.getDate() - 7)
  const meetings = await prisma.meeting.findMany({
    where: { meetingDate: { gte: since } },
    orderBy: { meetingDate: 'desc' },
    select: {
      id: true, title: true, meetingType: true, meetingDate: true,
      meetingScore: true, salesScore: true, riskLevel: true, sentimentOverall: true,
    },
  })
  await sendWeeklyDigest(meetings, user.email)
  return NextResponse.json({ success: true, sent: meetings.length })
}
