export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const meetings = await prisma.meeting.findMany({
      orderBy: { meetingDate: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    })
    return NextResponse.json(meetings)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
