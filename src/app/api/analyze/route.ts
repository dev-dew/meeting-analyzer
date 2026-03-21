import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { analyzeMeeting } from '@/lib/ai'
import { getSession } from '@/lib/session'
import { z } from 'zod'

const Schema = z.object({
  title: z.string().min(1),
  meetingType: z.enum(['monthly', 'pitching', 'first_meeting']),
  participants: z.array(z.object({ name: z.string(), role: z.enum(['staff', 'client']) })),
  meetingDate: z.string(),
  transcript: z.string().min(10),
  inputMethod: z.string().default('paste'),
  videoUrl: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = Schema.parse(await req.json())

    // Always use custom NLP engine — no external API needed
    const analysis = await analyzeMeeting(data.transcript, data.meetingType, data.participants)

    const meeting = await prisma.meeting.create({
      data: {
        title: data.title,
        meetingType: data.meetingType,
        participants: data.participants,
        meetingDate: new Date(data.meetingDate),
        transcript: data.transcript,
        inputMethod: data.inputMethod,
        videoUrl: data.videoUrl,
        createdBy: session.id,
        meetingScore: analysis.meetingScore,
        actionItemsScore: analysis.actionItemsScore,
        decisionMadeScore: analysis.decisionMadeScore,
        speakingBalance: analysis.speakingBalance,
        topicFocusScore: analysis.topicFocusScore,
        durationEfficiency: analysis.durationEfficiency,
        riskLevel: analysis.riskLevel,
        riskSignals: analysis.riskSignals ?? [],
        salesScore: analysis.salesScore,
        presentationStructure: analysis.presentationStructure,
        engagementScore: analysis.engagementScore,
        questionQualityScore: analysis.questionQualityScore,
        speechPaceScore: analysis.speechPaceScore,
        summary: analysis.summary,
        keyInsights: analysis.keyInsights,
        actionItems: analysis.actionItems,
        improvements: analysis.improvements,
        sentimentOverall: analysis.sentimentOverall,
      },
    })

    return NextResponse.json({ success: true, meeting })
  } catch (error) {
    console.error('Analyze error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
