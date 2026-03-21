export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PlusCircle, ArrowRight, Users } from 'lucide-react'
import { RiskBadge, MeetingTypeBadge, SentimentBadge } from '@/components/ui/Badges'
import { formatDate } from '@/lib/utils'

export default async function MeetingsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const meetings = await prisma.meeting.findMany({
    orderBy: { meetingDate: 'desc' },
    include: { user: { select: { name: true } } },
  })

  return (
    <div className="p-8 animate-in">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">All Meetings</h1>
          <p className="text-sm mt-1" style={{ color: '#666' }}>
            {meetings.length} total meeting{meetings.length !== 1 ? 's' : ''} analyzed
          </p>
        </div>
        <Link href="/analyze"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: '#F5C800', color: '#000' }}>
          <PlusCircle size={15} /> New Analysis
        </Link>
      </div>

      {meetings.length === 0 ? (
        <div className="rounded-2xl border p-16 text-center" style={{ background: '#141414', borderColor: '#222' }}>
          <div className="text-4xl mb-4">📋</div>
          <p className="text-white font-semibold mb-1">No meetings yet</p>
          <p className="text-sm mb-6" style={{ color: '#555' }}>Start by analyzing your first meeting</p>
          <Link href="/analyze" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm" style={{ background: '#F5C800', color: '#000' }}>
            <PlusCircle size={14} /> Analyze First Meeting
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((m: any) => {
            const score = m.meetingScore ?? m.salesScore
            const scoreColor = !score ? '#666' : score >= 80 ? '#22C55E' : score >= 60 ? '#F59E0B' : '#EF4444'
            const participants = Array.isArray(m.participants) ? m.participants : []
            return (
              <Link key={m.id} href={`/meetings/${m.id}`}
                className="flex items-center gap-5 px-6 py-5 rounded-2xl border transition-all hover:border-[#333] hover:bg-white/[0.01]"
                style={{ background: '#141414', borderColor: '#1E1E1E' }}>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-lg"
                  style={{ background: `${scoreColor}15`, color: scoreColor }}>
                  {score ?? '—'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-semibold text-white truncate">{m.title}</span>
                    <MeetingTypeBadge type={m.meetingType} />
                  </div>
                  {m.summary && <p className="text-xs leading-relaxed line-clamp-1 mb-1.5" style={{ color: '#777' }}>{m.summary}</p>}
                  <div className="flex items-center gap-4">
                    <span className="text-xs" style={{ color: '#555' }}>{formatDate(m.meetingDate)}</span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: '#555' }}>
                      <Users size={10} /> {participants.length} people
                    </span>
                    {m.user?.name && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,200,0,0.08)', color: '#F5C800' }}>
                        โดย {m.user.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {m.riskLevel && <RiskBadge level={m.riskLevel} />}
                  <SentimentBadge sentiment={m.sentimentOverall} />
                  <ArrowRight size={14} style={{ color: '#444' }} />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
