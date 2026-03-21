export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { notFound, redirect } from 'next/navigation'
import { MeetingDetailClient } from './MeetingDetailClient'

export default async function MeetingDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) redirect('/login')
  const meeting = await prisma.meeting.findUnique({
    where: { id: params.id },
    include: { user: { select: { name: true, email: true } } },
  })
  if (!meeting) notFound()
  return <MeetingDetailClient meeting={meeting as any} currentUserId={session.id} />
}
