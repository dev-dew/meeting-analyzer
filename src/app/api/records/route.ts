export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const page    = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit   = 10
    const search  = searchParams.get('search') || ''
    const type    = searchParams.get('type') || ''
    const risk    = searchParams.get('risk') || ''
    const from    = searchParams.get('from') || ''
    const to      = searchParams.get('to') || ''

    const where: any = {}
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (type)  where.meetingType = type
    if (risk)  where.riskLevel   = risk
    if (from || to) {
      where.meetingDate = {}
      if (from) where.meetingDate.gte = new Date(from)
      if (to)   where.meetingDate.lte = new Date(to + 'T23:59:59')
    }

    const [total, meetings] = await Promise.all([
      prisma.meeting.count({ where }),
      prisma.meeting.findMany({
        where,
        orderBy: { meetingDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, title: true, meetingType: true, meetingDate: true,
          meetingScore: true, salesScore: true, riskLevel: true,
          sentimentOverall: true, summary: true, participants: true,
          videoUrl: true, createdAt: true,
          user: { select: { name: true, email: true } },
        },
      }),
    ])

    return NextResponse.json({
      meetings,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
