// ============================================================
// H+ Hotel Plus — Custom NLP Engine (Rule-based, No API)
// ทำงานได้ offline 100% ไม่ต้องใช้ AI ภายนอก
// ============================================================

export interface MeetingAnalysisResult {
  meetingScore: number
  actionItemsScore: number
  decisionMadeScore: number
  speakingBalance: number
  topicFocusScore: number
  durationEfficiency: number
  riskLevel?: 'low' | 'medium' | 'high'
  riskSignals?: Array<{ text: string; type: string; severity: string }>
  salesScore?: number
  presentationStructure?: number
  engagementScore?: number
  questionQualityScore?: number
  speechPaceScore?: number
  summary: string
  keyInsights: string[]
  actionItems: string[]
  improvements: string[]
  sentimentOverall: 'positive' | 'neutral' | 'negative'
}

// ============================================================
// KEYWORD DICTIONARIES
// ============================================================

const RISK_KEYWORDS = {
  contract_risk: {
    severity: 'high' as const,
    patterns: [
      'ยกเลิกสัญญา', 'ไม่ต่อสัญญา', 'จะขอกลับไปทำเอง', 'ขอยกเลิก',
      'ไม่ต่อ', 'เลิกใช้บริการ', 'หยุดใช้', 'cancel contract',
      'won\'t renew', 'terminate', 'discontinue', 'end contract',
      'อาจจะไม่ต่อ', 'คิดจะเลิก', 'ยังไม่แน่ใจว่าจะต่อ',
    ],
  },
  price_complaint: {
    severity: 'high' as const,
    patterns: [
      'ค่าบริการสูง', 'แพงไป', 'แพงเกินไป', 'ค่าใช้จ่ายสูง',
      'ไม่คุ้ม', 'ราคาสูง', 'งบไม่พอ', 'ลดราคาได้ไหม',
      'too expensive', 'high cost', 'not worth', 'overpriced',
      'ค่าบริการแพง', 'ลดค่าบริการ', 'ต่อรองราคา',
    ],
  },
  sales_decline: {
    severity: 'medium' as const,
    patterns: [
      'ยอดขายตก', 'ยอดขายน้อย', 'ยอดจองตก', 'ยอดจองน้อย',
      'รายได้ลด', 'กำไรน้อย', 'ผลประกอบการแย่',
      'sales dropped', 'revenue down', 'bookings low',
      'ยอดลด', 'ตกลงมาก', 'น้อยกว่าเดิม', 'ไม่ถึงเป้า',
    ],
  },
  dissatisfaction: {
    severity: 'medium' as const,
    patterns: [
      'ไม่พอใจ', 'ผิดหวัง', 'ไม่ได้ผล', 'ไม่เห็นผล',
      'ทำไมถึง', 'ทำได้แค่นี้', 'แย่มาก', 'ไม่โอเค',
      'disappointed', 'not satisfied', 'unhappy', 'frustrated',
      'ไม่ work', 'ไม่ได้เรื่อง', 'น่าผิดหวัง',
    ],
  },
  urgency_warning: {
    severity: 'medium' as const,
    patterns: [
      'ต้องปรับปรุง', 'รีบแก้ไข', 'ต้องรีบ', 'เร่งด่วน',
      'ถ้าไม่ดีขึ้น', 'ให้โอกาสครั้งสุดท้าย', 'ครั้งสุดท้าย',
      'last chance', 'must improve', 'urgent', 'immediately',
    ],
  },
}

const POSITIVE_KEYWORDS = [
  'ดีมาก', 'ยอดเยี่ยม', 'พอใจ', 'ขอบคุณ', 'ประทับใจ',
  'ต่อสัญญา', 'อยากต่อ', 'ดีขึ้น', 'เพิ่มขึ้น', 'ถูกใจ',
  'excellent', 'great', 'satisfied', 'renew', 'happy', 'impressed',
  'ผลดี', 'คุ้มค่า', 'ได้ผล', 'work ดี', 'ชอบ',
]

const ACTION_PATTERNS = [
  /(?:จะ|ต้อง|ควร|โปรด|กรุณา|ช่วย|ขอให้|นัด|ส่ง|จัดทำ|เตรียม|ติดตาม|ประสาน|อัปเดต|แจ้ง)[^\n。.!?]{5,60}/g,
  /(?:action|todo|follow.?up|next step|deliverable)[^\n]{5,60}/gi,
  /(?:ภายใน|within|by)\s*\d+\s*(?:วัน|day|week|สัปดาห์)/g,
]

const DECISION_PATTERNS = [
  /(?:ตกลง|เห็นด้วย|อนุมัติ|ผ่าน|โอเค|ok|agree|approved|confirmed|decided)[^\n]{0,40}/gi,
  /(?:จึงมีมติ|ที่ประชุมมีมติ|สรุปว่า|ข้อสรุป)[^\n]{0,60}/g,
]

const OFF_TOPIC_PATTERNS = [
  /(?:เรื่องส่วนตัว|ไปกิน|ไปเที่ยว|นอกเรื่อง|off.?topic)/gi,
]

// ============================================================
// CORE ANALYSIS FUNCTIONS
// ============================================================

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[\s\n\r,。.!?;:]+/).filter(t => t.length > 1)
}

function countMatches(text: string, patterns: string[]): number {
  const lower = text.toLowerCase()
  return patterns.filter(p => lower.includes(p.toLowerCase())).length
}

function findMatchingSentences(text: string, patterns: string[]): string[] {
  const sentences = text.split(/[.\n!?]+/).map(s => s.trim()).filter(s => s.length > 5)
  const found: string[] = []
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase()
    for (const pattern of patterns) {
      if (lower.includes(pattern.toLowerCase()) && !found.includes(sentence)) {
        found.push(sentence)
      }
    }
  }
  return found
}

function extractSpeakers(transcript: string): Map<string, string[]> {
  const speakerMap = new Map<string, string[]>()
  const lines = transcript.split('\n').filter(l => l.trim())
  for (const line of lines) {
    const match = line.match(/^([^:：]{2,20})[：:]\s*(.+)/)
    if (match) {
      const speaker = match[1].trim()
      const text = match[2].trim()
      if (!speakerMap.has(speaker)) speakerMap.set(speaker, [])
      speakerMap.get(speaker)!.push(text)
    }
  }
  return speakerMap
}

function calcSpeakingBalance(speakerMap: Map<string, string[]>): number {
  if (speakerMap.size <= 1) return 50
  const counts = Array.from(speakerMap.values()).map(lines =>
    lines.reduce((sum, l) => sum + l.length, 0)
  )
  const total = counts.reduce((a, b) => a + b, 0)
  if (total === 0) return 50
  const percentages = counts.map(c => c / total)
  const ideal = 1 / counts.length
  const deviation = percentages.reduce((sum, p) => sum + Math.abs(p - ideal), 0)
  return Math.max(20, Math.round(100 - deviation * 200))
}

function scoreActionItems(transcript: string): { score: number; items: string[] } {
  const items: string[] = []
  for (const pattern of ACTION_PATTERNS) {
    const matches = transcript.match(pattern) || []
    items.push(...matches.map(m => m.trim()))
  }
  const unique = [...new Set(items)].slice(0, 6)
  const score = Math.min(100, 40 + unique.length * 15)
  return { score, items: unique }
}

function scoreDecisions(transcript: string): { score: number; decisions: string[] } {
  const decisions: string[] = []
  for (const pattern of DECISION_PATTERNS) {
    const matches = transcript.match(pattern) || []
    decisions.push(...matches.map(m => m.trim()))
  }
  const unique = [...new Set(decisions)].slice(0, 4)
  const score = Math.min(100, 35 + unique.length * 20)
  return { score, decisions: unique }
}

function scoreTopicFocus(transcript: string): number {
  const offTopicCount = (transcript.match(OFF_TOPIC_PATTERNS[0]) || []).length
  const lines = transcript.split('\n').filter(l => l.trim()).length
  if (lines === 0) return 60
  return Math.max(30, Math.round(90 - (offTopicCount / lines) * 300))
}

function scoreDuration(transcript: string): number {
  const lines = transcript.split('\n').filter(l => l.trim()).length
  const words = transcript.split(/\s+/).length
  if (words < 50) return 40
  if (words > 3000) return 55
  if (words < 200) return 65
  return Math.min(95, 60 + Math.round(words / 80))
}

function detectRisk(transcript: string): {
  riskLevel: 'low' | 'medium' | 'high'
  signals: Array<{ text: string; type: string; severity: string }>
} {
  const signals: Array<{ text: string; type: string; severity: string }> = []

  for (const [type, config] of Object.entries(RISK_KEYWORDS)) {
    const sentences = findMatchingSentences(transcript, config.patterns)
    for (const sentence of sentences.slice(0, 2)) {
      signals.push({ text: sentence.slice(0, 120), type, severity: config.severity })
    }
  }

  const highCount = signals.filter(s => s.severity === 'high').length
  const mediumCount = signals.filter(s => s.severity === 'medium').length

  let riskLevel: 'low' | 'medium' | 'high' = 'low'
  if (highCount >= 1 || signals.length >= 3) riskLevel = 'high'
  else if (mediumCount >= 1 || signals.length >= 2) riskLevel = 'medium'

  return { riskLevel, signals }
}

function detectSentiment(transcript: string): 'positive' | 'neutral' | 'negative' {
  const positiveCount = countMatches(transcript, POSITIVE_KEYWORDS)
  const allRiskPatterns = Object.values(RISK_KEYWORDS).flatMap(v => v.patterns)
  const negativeCount = countMatches(transcript, allRiskPatterns)

  if (positiveCount > negativeCount + 1) return 'positive'
  if (negativeCount > positiveCount + 1) return 'negative'
  return 'neutral'
}

function generateSummary(
  transcript: string,
  meetingType: string,
  riskLevel: string,
  sentiment: string,
  actionCount: number
): string {
  const lines = transcript.split('\n').filter(l => l.trim())
  const speakerMap = extractSpeakers(transcript)
  const speakers = speakerMap.size

  const typeLabel = meetingType === 'monthly' ? 'การประชุมประจำเดือน'
    : meetingType === 'pitching' ? 'การนำเสนอขาย'
    : 'การประชุมครั้งแรก'

  const riskLabel = riskLevel === 'high' ? 'มีสัญญาณเสี่ยงสูงในการยกเลิกสัญญา'
    : riskLevel === 'medium' ? 'มีสัญญาณเสี่ยงระดับกลางที่ควรติดตาม'
    : 'ไม่พบสัญญาณเสี่ยงที่น่ากังวล'

  const sentimentLabel = sentiment === 'positive' ? 'บรรยากาศโดยรวมเป็นบวก'
    : sentiment === 'negative' ? 'บรรยากาศโดยรวมเป็นลบ'
    : 'บรรยากาศโดยรวมเป็นกลาง'

  return `${typeLabel}มีผู้เข้าร่วม ${speakers} คน รวม ${lines.length} บรรทัดสนทนา ${sentimentLabel} ${riskLabel} พบ action items ${actionCount} รายการ`
}

function generateInsights(
  transcript: string,
  speakerMap: Map<string, string[]>,
  riskSignals: Array<{ type: string }>,
  sentiment: string
): string[] {
  const insights: string[] = []
  const words = transcript.split(/\s+/).length

  if (speakerMap.size > 0) {
    insights.push(`มีผู้เข้าร่วมประชุม ${speakerMap.size} คน รวม ${words} คำในการสนทนา`)
  }

  if (sentiment === 'positive') insights.push('ลูกค้ามีทัศนคติเชิงบวกต่อบริการ')
  else if (sentiment === 'negative') insights.push('ลูกค้ามีความกังวลหรือไม่พอใจในบางประเด็น')
  else insights.push('การประชุมดำเนินไปในทิศทางเป็นกลาง')

  const riskTypes = [...new Set(riskSignals.map(s => s.type))]
  if (riskTypes.includes('contract_risk')) insights.push('ตรวจพบสัญญาณเสี่ยงการยกเลิกสัญญา ควรติดตามเร่งด่วน')
  if (riskTypes.includes('price_complaint')) insights.push('ลูกค้ากังวลเรื่องค่าบริการ ควรพิจารณา package ใหม่')
  if (riskTypes.includes('sales_decline')) insights.push('ยอดขาย/ยอดจองลดลง ควรวิเคราะห์สาเหตุและวางแผนแก้ไข')

  const positiveHits = countMatches(transcript, POSITIVE_KEYWORDS)
  if (positiveHits > 3) insights.push('ลูกค้าแสดงความพอใจและมีแนวโน้มต่อสัญญา')

  return insights.slice(0, 4)
}

function generateImprovements(
  actionScore: number,
  decisionScore: number,
  balanceScore: number,
  focusScore: number,
  riskLevel: string,
  meetingType: string
): string[] {
  const improvements: string[] = []

  if (actionScore < 60) improvements.push('ควรกำหนด action items ที่ชัดเจน ระบุผู้รับผิดชอบและ deadline')
  if (decisionScore < 60) improvements.push('ควรสรุป decision ที่ได้ในที่ประชุมให้ชัดเจนก่อนปิด')
  if (balanceScore < 60) improvements.push('ควรเปิดโอกาสให้ทุกคนพูด ไม่ให้คนใดคนหนึ่ง dominate')
  if (focusScore < 70) improvements.push('ควรจำกัดหัวข้อและกลับมา focus ที่ agenda หลัก')
  if (riskLevel === 'high') improvements.push('ควรเตรียม retention strategy และ value proposition ก่อนประชุมครั้งถัดไป')
  if (riskLevel === 'medium') improvements.push('ควรติดตามความพึงพอใจของลูกค้าอย่างใกล้ชิด')
  if (meetingType === 'pitching') improvements.push('ควรเตรียม ROI case study และ pricing ที่ชัดเจนสำหรับการ pitch')

  if (improvements.length === 0) improvements.push('การประชุมดำเนินไปได้ดี ควรรักษามาตรฐานนี้ต่อไป')

  return improvements.slice(0, 4)
}

// Sales-specific scoring
function scoreSalesMeeting(transcript: string): {
  salesScore: number
  presentationStructure: number
  engagementScore: number
  questionQualityScore: number
  speechPaceScore: number
} {
  const lower = transcript.toLowerCase()

  // Presentation structure: intro → problem → solution → price → CTA
  const hasIntro = /สวัสดี|แนะนำ|ยินดี|hello|introduce/.test(lower)
  const hasProblem = /ปัญหา|ความต้องการ|challenge|problem|need/.test(lower)
  const hasSolution = /บริการ|solution|ช่วย|แก้ไข|เพิ่ม|improve/.test(lower)
  const hasPrice = /ราคา|แพ็กเกจ|package|price|cost|ค่าบริการ/.test(lower)
  const hasCTA = /สนใจ|ติดต่อ|นัด|proposal|ส่งข้อมูล|follow/.test(lower)
  const structureScore = Math.round(
    (([hasIntro, hasProblem, hasSolution, hasPrice, hasCTA].filter(Boolean).length) / 5) * 100
  )

  // Engagement: client asks questions
  const speakerMap = extractSpeakers(transcript)
  const clientSpeakers = Array.from(speakerMap.entries())
  const questionCount = (transcript.match(/\?|ไหม|หรือเปล่า|อย่างไร|ยังไง|ทำไม|เท่าไร/g) || []).length
  const engagementScore = Math.min(100, 30 + questionCount * 8)

  // Question quality: staff handles objections
  const objectionHandled = /เข้าใจ|ได้เลย|แน่นอน|ครับ|ค่ะ|ยืนยัน|มั่นใจ/.test(lower)
  const questionQualityScore = objectionHandled ? Math.min(100, 55 + questionCount * 5) : 40

  // Speech pace proxy: avg line length
  const lines = transcript.split('\n').filter(l => l.trim())
  const avgLen = lines.reduce((s, l) => s + l.length, 0) / (lines.length || 1)
  const speechPaceScore = avgLen > 200 ? 45 : avgLen > 80 ? 75 : avgLen > 40 ? 85 : 60

  const salesScore = Math.round((structureScore + engagementScore + questionQualityScore + speechPaceScore) / 4)

  return { salesScore, presentationStructure: structureScore, engagementScore, questionQualityScore, speechPaceScore }
}

// ============================================================
// MAIN EXPORT FUNCTION
// ============================================================

export async function analyzeMeeting(
  transcript: string,
  meetingType: string,
  participants: Array<{ name: string; role: string }>
): Promise<MeetingAnalysisResult> {

  const speakerMap = extractSpeakers(transcript)
  const { score: actionScore, items: rawActions } = scoreActionItems(transcript)
  const { score: decisionScore } = scoreDecisions(transcript)
  const balanceScore = calcSpeakingBalance(speakerMap)
  const focusScore = scoreTopicFocus(transcript)
  const durationScore = scoreDuration(transcript)
  const sentiment = detectSentiment(transcript)

  const meetingScore = Math.round(
    (actionScore * 0.25) +
    (decisionScore * 0.20) +
    (balanceScore * 0.20) +
    (focusScore * 0.20) +
    (durationScore * 0.15)
  )

  const isMonthly = meetingType === 'monthly' || meetingType === 'first_meeting'
  const isPitching = meetingType === 'pitching'

  let riskLevel: 'low' | 'medium' | 'high' | undefined
  let riskSignals: Array<{ text: string; type: string; severity: string }> | undefined

  if (isMonthly) {
    const risk = detectRisk(transcript)
    riskLevel = risk.riskLevel
    riskSignals = risk.signals
  }

  let salesData: ReturnType<typeof scoreSalesMeeting> | undefined
  if (isPitching) {
    salesData = scoreSalesMeeting(transcript)
  }

  const summary = generateSummary(transcript, meetingType, riskLevel ?? 'low', sentiment, rawActions.length)
  const insights = generateInsights(transcript, speakerMap, riskSignals ?? [], sentiment)
  const improvements = generateImprovements(actionScore, decisionScore, balanceScore, focusScore, riskLevel ?? 'low', meetingType)

  // Clean action items into readable strings
  const actionItems = rawActions.length > 0
    ? rawActions.map(a => a.replace(/^(จะ|ต้อง|ควร|action:|todo:)/i, '').trim()).slice(0, 5)
    : ['ติดตามผลการประชุมภายใน 3 วัน', 'จัดส่งสรุปการประชุมให้ผู้เกี่ยวข้อง']

  return {
    meetingScore,
    actionItemsScore: actionScore,
    decisionMadeScore: decisionScore,
    speakingBalance: balanceScore,
    topicFocusScore: focusScore,
    durationEfficiency: durationScore,
    riskLevel,
    riskSignals,
    ...(salesData ?? {}),
    summary,
    keyInsights: insights,
    actionItems,
    improvements,
    sentimentOverall: sentiment,
  }
}
