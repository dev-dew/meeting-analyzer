import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function RiskBadge({ level }: { level?: string | null }) {
  if (!level) return null
  const config = {
    high: { icon: AlertTriangle, label: 'High Risk', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
    medium: { icon: AlertCircle, label: 'Medium Risk', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
    low: { icon: CheckCircle, label: 'Low Risk', cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
  }[level] ?? { icon: CheckCircle, label: level, cls: 'bg-gray-500/15 text-gray-400 border-gray-500/30' }
  const Icon = config.icon
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border', config.cls)}>
      <Icon size={11} />
      {config.label}
    </span>
  )
}

export function MeetingTypeBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    monthly: { label: 'Monthly', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    pitching: { label: 'Pitching', cls: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
    first_meeting: { label: 'First Meeting', cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  }
  const c = config[type] ?? { label: type, cls: 'bg-gray-500/15 text-gray-400 border-gray-500/30' }
  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border', c.cls)}>
      {c.label}
    </span>
  )
}

export function SentimentBadge({ sentiment }: { sentiment?: string | null }) {
  if (!sentiment) return null
  const config: Record<string, { label: string; cls: string }> = {
    positive: { label: '😊 Positive', cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
    neutral:  { label: '😐 Neutral',  cls: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
    negative: { label: '😟 Negative', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
  }
  const c = config[sentiment] ?? config.neutral
  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border', c.cls)}>
      {c.label}
    </span>
  )
}
