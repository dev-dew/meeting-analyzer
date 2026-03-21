'use client'
import { cn } from '@/lib/utils'

interface MetricBarProps { label: string; score: number | null; description?: string }

export function MetricBar({ label, score, description }: MetricBarProps) {
  const s = score ?? 0
  const color = s >= 80 ? '#22C55E' : s >= 60 ? '#F59E0B' : '#EF4444'
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-white">{label}</span>
          {description && <span className="text-xs ml-2" style={{ color: '#666' }}>{description}</span>}
        </div>
        <span className="text-sm font-bold" style={{ color }}>{s}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#222' }}>
        <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${s}%`, background: color }} />
      </div>
    </div>
  )
}

export function MetricGrid({ metrics }: { metrics: Array<{ label: string; score: number | null; description?: string }> }) {
  return <div className="space-y-4">{metrics.map(m => <MetricBar key={m.label} {...m} />)}</div>
}
