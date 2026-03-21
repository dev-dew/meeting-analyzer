export interface Participant {
  name: string
  role: 'staff' | 'client'
}

export interface RiskSignal {
  text: string
  type: string
  severity: 'low' | 'medium' | 'high'
}

export interface Meeting {
  id: string
  title: string
  meetingType: string
  participants: Participant[]
  meetingDate: Date
  transcript: string
  inputMethod: string

  meetingScore: number | null
  actionItemsScore: number | null
  decisionMadeScore: number | null
  speakingBalance: number | null
  topicFocusScore: number | null
  durationEfficiency: number | null

  riskLevel: string | null
  riskSignals: RiskSignal[] | null

  salesScore: number | null
  presentationStructure: number | null
  engagementScore: number | null
  questionQualityScore: number | null
  speechPaceScore: number | null

  summary: string | null
  keyInsights: string[] | null
  actionItems: string[] | null
  improvements: string[] | null
  sentimentOverall: string | null

  createdAt: Date
  updatedAt: Date
}

export interface DashboardStats {
  total: number
  avgScore: number
  highRiskCount: number
  mediumRiskCount: number
  lowRiskCount: number
  monthlyCount: number
  pitchingCount: number
}
