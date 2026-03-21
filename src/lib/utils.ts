import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getRiskColor(level?: string | null) {
  switch (level) {
    case 'high': return 'text-red-400'
    case 'medium': return 'text-yellow-400'
    case 'low': return 'text-green-400'
    default: return 'text-gray-400'
  }
}

export function getRiskBg(level?: string | null) {
  switch (level) {
    case 'high': return 'bg-red-500/10 border-red-500/30'
    case 'medium': return 'bg-yellow-500/10 border-yellow-500/30'
    case 'low': return 'bg-green-500/10 border-green-500/30'
    default: return 'bg-gray-500/10 border-gray-500/30'
  }
}

export function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-yellow-400'
  return 'text-red-400'
}

export function getMeetingTypeLabel(type: string) {
  switch (type) {
    case 'monthly': return 'Monthly Meeting'
    case 'pitching': return 'Pitching Meeting'
    case 'first_meeting': return 'First Meeting'
    default: return type
  }
}

export function getMeetingTypeBadge(type: string) {
  switch (type) {
    case 'monthly': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    case 'pitching': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    case 'first_meeting': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
  }
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function highlightRiskText(text: string, signals: Array<{ text: string; severity: string }>) {
  if (!signals || signals.length === 0) return text
  
  let result = text
  signals.forEach(signal => {
    const escaped = signal.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const className = signal.severity === 'high' ? 'highlight-risk' 
                    : signal.severity === 'medium' ? 'highlight-warning'
                    : 'highlight-positive'
    result = result.replace(
      new RegExp(escaped, 'g'),
      `<mark class="${className}">${signal.text}</mark>`
    )
  })
  return result
}
