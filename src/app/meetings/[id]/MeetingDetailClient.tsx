'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, AlertTriangle, CheckCircle2, Lightbulb, Target, Users, Calendar, ExternalLink } from 'lucide-react'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { MetricGrid } from '@/components/ui/MetricBar'
import { RiskBadge, MeetingTypeBadge, SentimentBadge } from '@/components/ui/Badges'
import { formatDate, highlightRiskText } from '@/lib/utils'

interface Meeting {
  id: string; title: string; meetingType: string
  participants: Array<{ name: string; role: string }>
  meetingDate: Date; transcript: string; videoUrl?: string | null
  meetingScore: number | null; actionItemsScore: number | null
  decisionMadeScore: number | null; speakingBalance: number | null
  topicFocusScore: number | null; durationEfficiency: number | null
  riskLevel: string | null; riskSignals: Array<{ text: string; type: string; severity: string }> | null
  salesScore: number | null; presentationStructure: number | null
  engagementScore: number | null; questionQualityScore: number | null; speechPaceScore: number | null
  summary: string | null; keyInsights: string[] | null; actionItems: string[] | null
  improvements: string[] | null; sentimentOverall: string | null; createdAt: Date
  user?: { name: string; email: string }; createdBy: string
}

export function MeetingDetailClient({ meeting: m, currentUserId }: { meeting: Meeting; currentUserId: string }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'transcript' | 'insights'>('overview')
  const [deleting, setDeleting] = useState(false)

  const isPitching = m.meetingType === 'pitching'
  const mainScore = isPitching ? m.salesScore : m.meetingScore
  const scoreColor = !mainScore ? '#666' : mainScore >= 80 ? '#22C55E' : mainScore >= 60 ? '#F59E0B' : '#EF4444'

  const qualityMetrics = [
    { label: 'Action Items', score: m.actionItemsScore, description: 'Clear tasks defined' },
    { label: 'Decision Made', score: m.decisionMadeScore, description: 'Decisions reached' },
    { label: 'Speaking Balance', score: m.speakingBalance, description: 'Participation balance' },
    { label: 'Topic Focus', score: m.topicFocusScore, description: 'Stayed on agenda' },
    { label: 'Duration Efficiency', score: m.durationEfficiency, description: 'Time well used' },
  ]
  const salesMetrics = [
    { label: 'Presentation Structure', score: m.presentationStructure },
    { label: 'Engagement', score: m.engagementScore },
    { label: 'Question Quality', score: m.questionQualityScore },
    { label: 'Speech Pace', score: m.speechPaceScore },
  ]

  const riskSignals = Array.isArray(m.riskSignals) ? m.riskSignals : []
  const keyInsights = Array.isArray(m.keyInsights) ? m.keyInsights : []
  const actionItems = Array.isArray(m.actionItems) ? m.actionItems : []
  const improvements = Array.isArray(m.improvements) ? m.improvements : []
  const participants = Array.isArray(m.participants) ? m.participants : []
  const highlightedTranscript = riskSignals.length > 0 ? highlightRiskText(m.transcript, riskSignals) : m.transcript

  async function handleDelete() {
    if (!confirm('Delete this meeting analysis?')) return
    setDeleting(true)
    await fetch(`/api/meetings/${m.id}`, { method: 'DELETE' })
    router.push('/meetings')
  }

  const TABS = [
    { id: 'overview', label: 'Analysis' },
    { id: 'transcript', label: 'Transcript' },
    { id: 'insights', label: 'Insights & Actions' },
  ] as const

  return (
    <div className="p-8 animate-in">
      {/* Back + Delete */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/meetings" className="flex items-center gap-2 text-sm transition-colors hover:text-white" style={{ color: '#666' }}>
          <ArrowLeft size={14} /> Back to Meetings
        </Link>
        <button onClick={handleDelete} disabled={deleting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all hover:bg-red-500/10"
          style={{ borderColor: '#333', color: '#666' }}>
          <Trash2 size={12} /> {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      {/* Header Card */}
      <div className="rounded-2xl p-6 border mb-6" style={{ background: '#141414', borderColor: '#222' }}>
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            <ScoreRing score={mainScore ?? 0} size={100} label={isPitching ? 'Sales Score' : 'Meeting Score'} />
          </div>
          <div className="flex-1">
            <div className="flex items-start gap-3 mb-2 flex-wrap">
              <h1 className="text-xl font-bold text-white">{m.title}</h1>
              <MeetingTypeBadge type={m.meetingType} />
            </div>
            {m.summary && <p className="text-sm leading-relaxed mb-4" style={{ color: '#999' }}>{m.summary}</p>}
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2 text-sm" style={{ color: '#666' }}>
                <Calendar size={13} /> {formatDate(m.meetingDate)}
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: '#666' }}>
                <Users size={13} /> {participants.length} participants
              </div>
              {m.user?.name && (
                <div className="text-sm" style={{ color: '#666' }}>
                  วิเคราะห์โดย <span style={{ color: '#F5C800' }}>{m.user.name}</span>
                </div>
              )}
              <SentimentBadge sentiment={m.sentimentOverall} />
              {m.riskLevel && <RiskBadge level={m.riskLevel} />}
            </div>
            {/* Video URL */}
            {m.videoUrl && (
              <a href={m.videoUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-lg text-xs border transition-all hover:bg-white/5"
                style={{ borderColor: '#333', color: '#888' }}>
                <ExternalLink size={11} /> ดูคลิปการประชุม
              </a>
            )}
            {/* Participants */}
            <div className="flex gap-2 mt-4 flex-wrap">
              {participants.map((p, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium border"
                  style={p.role === 'staff'
                    ? { background: 'rgba(96,165,250,0.1)', color: '#60A5FA', borderColor: 'rgba(96,165,250,0.2)' }
                    : { background: 'rgba(245,200,0,0.1)', color: '#F5C800', borderColor: 'rgba(245,200,0,0.2)' }}>
                  {p.name} · {p.role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Risk Banner */}
      {m.riskLevel === 'high' && riskSignals.length > 0 && (
        <div className="rounded-2xl p-5 border mb-6" style={{ background: 'rgba(239,68,68,0.07)', borderColor: 'rgba(239,68,68,0.25)' }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} style={{ color: '#EF4444' }} />
            <span className="font-semibold text-sm" style={{ color: '#EF4444' }}>High Contract Termination Risk Detected</span>
          </div>
          <div className="space-y-2">
            {riskSignals.map((sig, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="px-2 py-0.5 rounded text-xs font-medium flex-shrink-0"
                  style={{ background: sig.severity === 'high' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)', color: sig.severity === 'high' ? '#EF4444' : '#F59E0B' }}>
                  {sig.type.replace('_', ' ')}
                </span>
                <span style={{ color: '#CCC' }}>"{sig.text}"</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ background: '#141414', border: '1px solid #222' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-all"
            style={activeTab === tab.id ? { background: '#F5C800', color: '#000' } : { color: '#666' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-6 animate-in">
          <div className="rounded-2xl p-6 border" style={{ background: '#141414', borderColor: '#222' }}>
            <h2 className="text-sm font-semibold mb-5 uppercase tracking-wider" style={{ color: '#F5C800' }}>Meeting Quality Metrics</h2>
            <MetricGrid metrics={qualityMetrics} />
          </div>
          <div className="space-y-4">
            {isPitching ? (
              <div className="rounded-2xl p-6 border" style={{ background: '#141414', borderColor: '#222' }}>
                <h2 className="text-sm font-semibold mb-5 uppercase tracking-wider" style={{ color: '#A78BFA' }}>Sales Effectiveness</h2>
                <MetricGrid metrics={salesMetrics} />
                {m.salesScore !== null && (
                  <div className="mt-5 pt-5 border-t flex items-center justify-between" style={{ borderColor: '#222' }}>
                    <span className="text-sm font-semibold text-white">Final Sales Score</span>
                    <span className="text-2xl font-bold" style={{ color: scoreColor }}>{m.salesScore}/100</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl p-6 border" style={{ background: '#141414', borderColor: '#222' }}>
                <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: '#F5C800' }}>Termination Risk</h2>
                {riskSignals.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#22C55E' }}>
                    <CheckCircle2 size={14} /> No risk signals detected
                  </div>
                ) : (
                  <div className="space-y-3">
                    {riskSignals.map((sig, i) => (
                      <div key={i} className="p-3 rounded-xl border"
                        style={{ background: sig.severity === 'high' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)', borderColor: sig.severity === 'high' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle size={11} style={{ color: sig.severity === 'high' ? '#EF4444' : '#F59E0B' }} />
                          <span className="text-xs font-medium uppercase" style={{ color: sig.severity === 'high' ? '#EF4444' : '#F59E0B' }}>{sig.type.replace(/_/g, ' ')}</span>
                        </div>
                        <p className="text-xs" style={{ color: '#CCC' }}>"{sig.text}"</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex items-center gap-2">
                  <RiskBadge level={m.riskLevel} />
                  <span className="text-xs" style={{ color: '#666' }}>Overall risk assessment</span>
                </div>
              </div>
            )}
            <div className="rounded-2xl p-6 border flex items-center justify-center" style={{ background: '#141414', borderColor: '#222' }}>
              <ScoreRing score={m.meetingScore ?? 0} size={130} label="Meeting Quality" sublabel="Overall score" />
              {isPitching && <div className="ml-6"><ScoreRing score={m.salesScore ?? 0} size={130} label="Sales Score" sublabel="Effectiveness" /></div>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transcript' && (
        <div className="animate-in">
          <div className="rounded-2xl p-6 border" style={{ background: '#141414', borderColor: '#222' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#F5C800' }}>Full Transcript</h2>
              {riskSignals.length > 0 && (
                <div className="flex items-center gap-3 text-xs" style={{ color: '#666' }}>
                  <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded inline-block" style={{ background: '#EF4444' }} /> High risk</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded inline-block" style={{ background: '#F59E0B' }} /> Warning</span>
                </div>
              )}
            </div>
            <div className="text-sm leading-8 font-mono whitespace-pre-wrap" style={{ color: '#CCC' }}
              dangerouslySetInnerHTML={{ __html: highlightedTranscript }} />
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="grid grid-cols-3 gap-6 animate-in">
          {[
            { icon: Lightbulb, title: 'Key Insights', items: keyInsights, color: '#F5C800', dot: false },
            { icon: Target, title: 'Action Items', items: actionItems, color: '#22C55E', dot: false },
            { icon: AlertTriangle, title: 'Improvements', items: improvements, color: '#A78BFA', dot: true },
          ].map(({ icon: Icon, title, items, color, dot }) => (
            <div key={title} className="rounded-2xl p-6 border" style={{ background: '#141414', borderColor: '#222' }}>
              <div className="flex items-center gap-2 mb-4">
                <Icon size={14} style={{ color }} />
                <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color }}>{title}</h2>
              </div>
              <div className="space-y-3">
                {items.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    {dot ? (
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2" style={{ background: color }} />
                    ) : title === 'Action Items' ? (
                      <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" style={{ color }} />
                    ) : (
                      <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold"
                        style={{ background: `${color}20`, color }}>{i + 1}</span>
                    )}
                    <p className="text-sm leading-relaxed" style={{ color: '#CCC' }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
