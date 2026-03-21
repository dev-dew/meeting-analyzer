import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const meetings = await prisma.meeting.findMany({
      select: {
        meetingType: true,
        meetingScore: true,
        riskLevel: true,
        salesScore: true,
        sentimentOverall: true,
        meetingDate: true,
      },
    })

    const total = meetings.length
    const scored = meetings.filter(m => m.meetingScore !== null)
    const avgScore = scored.length
      ? Math.round(scored.reduce((s, m) => s + (m.meetingScore ?? 0), 0) / scored.length)
      : 0

    const highRiskCount = meetings.filter(m => m.riskLevel === 'high').length
    const mediumRiskCount = meetings.filter(m => m.riskLevel === 'medium').length
    const lowRiskCount = meetings.filter(m => m.riskLevel === 'low').length
    const monthlyCount = meetings.filter(m => m.meetingType === 'monthly').length
    const pitchingCount = meetings.filter(m => m.meetingType === 'pitching').length

    // Score trend (last 6 meetings)
    const recent = meetings
      .filter(m => m.meetingScore !== null)
      .sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime())
      .slice(0, 6)
      .reverse()
      .map(m => ({ score: m.meetingScore, date: m.meetingDate, type: m.meetingType }))

    return NextResponse.json({
      total,
      avgScore,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      monthlyCount,
      pitchingCount,
      recent,
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
