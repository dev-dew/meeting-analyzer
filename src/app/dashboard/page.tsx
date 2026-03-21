export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const meetings = await prisma.meeting.findMany({
    orderBy: { meetingDate: 'desc' },
    select: {
      id: true,
      title: true,
      meetingType: true,
      meetingDate: true,
      meetingScore: true,
      salesScore: true,
      riskLevel: true,
      sentimentOverall: true,
      summary: true,
      participants: true,
      createdBy: true,
      user: { select: { name: true } },
    },
  })

  const total = meetings.length
  const scored = meetings.filter((m) => m.meetingScore !== null)
  const avgScore = scored.length
    ? Math.round(scored.reduce((s, m) => s + (m.meetingScore ?? 0), 0) / scored.length)
    : 0
  const highRisk = meetings.filter((m) => m.riskLevel === 'high').length
  const mediumRisk = meetings.filter((m) => m.riskLevel === 'medium').length

  const recent = meetings.slice(0, 5).map((m) => ({
    ...m,
    createdByName: m.user?.name,
  }))

  const trend = meetings
    .filter((m) => m.meetingScore !== null)
    .slice(0, 8)
    .reverse()
    .map((m) => ({
      name: m.title.length > 20 ? m.title.slice(0, 20) + '…' : m.title,
      score: m.meetingScore,
      type: m.meetingType,
      title: m.title,
    }))

  return (
    <DashboardClient data={{
      total, avgScore, highRisk, mediumRisk,
      recent, trend,
      meetings: meetings as any,
      userName: session.name,
    }} />
  )
}
