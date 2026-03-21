'use client'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { AlertTriangle, TrendingUp, FileText, PlusCircle, ArrowRight, Users } from 'lucide-react'
import { RiskBadge, MeetingTypeBadge, SentimentBadge } from '@/components/ui/Badges'
import { formatDate } from '@/lib/utils'

interface Props {
  data: {
    total: number
    avgScore: number
    highRisk: number
    mediumRisk: number
    recent: any[]
    trend: any[]
    meetings: any[]
    userName: string
  }
}

export function DashboardClient({ data }: Props) {
  const { total, avgScore, highRisk, mediumRisk, recent, trend, userName } = data
  const scoreColor = avgScore >= 80 ? '#22C55E' : avgScore >= 60 ? '#F59E0B' : '#EF4444'

  return (
    <div className="p-8 space-y-8 animate-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Meeting Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: '#666' }}>
            สวัสดี <span style={{ color: '#F5C800' }}>{userName}</span> — ยินดีต้อนรับกลับสู่ระบบ
          </p>
        </div>
        <Link href="/analyze"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
          style={{ background: '#F5C800', color: '#000' }}>
          <PlusCircle size={15} /> New Analysis
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Meetings', value: total, icon: FileText, sub: 'All time', color: '#F5C800' },
          { label: 'Avg Meeting Score', value: avgScore ? `${avgScore}` : '—', icon: TrendingUp, sub: 'Across all meetings', color: scoreColor },
          { label: 'High Risk Alerts', value: highRisk, icon: AlertTriangle, sub: 'Needs attention', color: '#EF4444' },
          { label: 'Medium Risk', value: mediumRisk, icon: AlertTriangle, sub: 'Monitor closely', color: '#F59E0B' },
        ].map(({ label, value, icon: Icon, sub, color }) => (
          <div key={label} className="rounded-2xl p-5 border" style={{ background: '#141414', borderColor: '#222' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: `${color}18` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{value}</div>
            <div className="text-sm font-medium text-white">{label}</div>
            <div className="text-xs mt-0.5" style={{ color: '#555' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Chart + Risk */}
      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 rounded-2xl p-6 border" style={{ background: '#141414', borderColor: '#222' }}>
          <div className="mb-5">
            <h2 className="text-base font-semibold text-white">Score Trend</h2>
            <p className="text-xs mt-0.5" style={{ color: '#666' }}>Recent meetings performance</p>
          </div>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trend} barSize={28}>
                <XAxis dataKey="name" tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-18} textAnchor="end" height={48} />
                <YAxis domain={[0, 100]} tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1A1A1A', border: '1px solid #333', borderRadius: '8px', fontSize: 12 }} labelStyle={{ color: '#E8E8E8' }} formatter={(val: any) => [`${val}/100`, 'Score']} />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {trend.map((entry, i) => (
                    <Cell key={i} fill={(entry.score ?? 0) >= 80 ? '#22C55E' : (entry.score ?? 0) >= 60 ? '#F59E0B' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <div className="text-center">
                <p style={{ color: '#555' }} className="text-sm">No data yet</p>
                <Link href="/analyze" className="text-xs mt-1 block" style={{ color: '#F5C800' }}>Add your first meeting →</Link>
              </div>
            </div>
          )}
        </div>

        <div className="col-span-2 rounded-2xl p-6 border" style={{ background: '#141414', borderColor: '#222' }}>
          <div className="mb-5">
            <h2 className="text-base font-semibold text-white">Risk Overview</h2>
            <p className="text-xs mt-0.5" style={{ color: '#666' }}>Contract termination signals</p>
          </div>
          <div className="space-y-3">
            {[
              { level: 'High', count: highRisk, color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
              { level: 'Medium', count: mediumRisk, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
              { level: 'Low', count: data.meetings.filter((m: any) => m.riskLevel === 'low').length, color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
            ].map(({ level, count, color, bg }) => (
              <div key={level} className="flex items-center justify-between p-3 rounded-xl" style={{ background: bg }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-sm font-medium" style={{ color }}>{level} Risk</span>
                </div>
                <span className="text-lg font-bold" style={{ color }}>{count}</span>
              </div>
            ))}
          </div>
          {highRisk > 0 && (
            <div className="mt-4 p-3 rounded-xl border" style={{ background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)' }}>
              <p className="text-xs" style={{ color: '#EF4444' }}>⚠️ {highRisk} meeting{highRisk > 1 ? 's' : ''} with high contract termination risk</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Meetings */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: '#141414', borderColor: '#222' }}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#222' }}>
          <div>
            <h2 className="text-base font-semibold text-white">Recent Meetings</h2>
            <p className="text-xs mt-0.5" style={{ color: '#666' }}>Latest analyzed meetings</p>
          </div>
          <Link href="/meetings" className="flex items-center gap-1 text-xs font-medium" style={{ color: '#F5C800' }}>
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={32} className="mx-auto mb-3" style={{ color: '#333' }} />
            <p className="text-sm" style={{ color: '#555' }}>No meetings analyzed yet</p>
            <Link href="/analyze" className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: '#F5C800', color: '#000' }}>
              <PlusCircle size={14} /> Analyze First Meeting
            </Link>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#1A1A1A' }}>
            {recent.map((m: any) => {
              const score = m.meetingScore ?? m.salesScore
              const scoreColor = !score ? '#666' : score >= 80 ? '#22C55E' : score >= 60 ? '#F59E0B' : '#EF4444'
              const participants = Array.isArray(m.participants) ? m.participants : []
              return (
                <Link key={m.id} href={`/meetings/${m.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${scoreColor}18` }}>
                    <span className="text-base font-bold" style={{ color: scoreColor }}>{score ?? '—'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white truncate">{m.title}</span>
                      <MeetingTypeBadge type={m.meetingType} />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: '#555' }}>{formatDate(m.meetingDate)}</span>
                      <span className="flex items-center gap-1 text-xs" style={{ color: '#555' }}>
                        <Users size={10} /> {participants.length}
                      </span>
                      {m.createdByName && (
                        <span className="text-xs" style={{ color: '#444' }}>โดย {m.createdByName}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
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
    </div>
  )
}
