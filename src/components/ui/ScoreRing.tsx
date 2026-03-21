'use client'
import { cn } from '@/lib/utils'

interface ScoreRingProps {
  score: number; size?: number; strokeWidth?: number
  label?: string; sublabel?: string; className?: string
}

export function ScoreRing({ score, size = 120, strokeWidth = 8, label, sublabel, className }: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (score / 100) * circumference
  const color = score >= 80 ? '#22C55E' : score >= 60 ? '#F59E0B' : '#EF4444'

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#222" strokeWidth={strokeWidth} />
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bold leading-none" style={{ fontSize: size * 0.22, color }}>{score}</span>
          <span style={{ fontSize: size * 0.1, color: '#666' }}>/100</span>
        </div>
      </div>
      {label && <div className="text-sm font-medium text-white text-center">{label}</div>}
      {sublabel && <div className="text-xs text-center" style={{ color: '#666' }}>{sublabel}</div>}
    </div>
  )
}
