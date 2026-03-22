export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import ExcelJS from 'exceljs'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const type   = searchParams.get('type') || ''
    const risk   = searchParams.get('risk') || ''
    const from   = searchParams.get('from') || ''
    const to     = searchParams.get('to') || ''

    const where: any = {}
    if (search) where.OR = [{ title: { contains: search, mode: 'insensitive' } }]
    if (type) where.meetingType = type
    if (risk) where.riskLevel = risk
    if (from || to) {
      where.meetingDate = {}
      if (from) where.meetingDate.gte = new Date(from)
      if (to)   where.meetingDate.lte = new Date(to + 'T23:59:59')
    }

    const meetings = await prisma.meeting.findMany({
      where,
      orderBy: { meetingDate: 'desc' },
      include: { user: { select: { name: true } } },
    })

    const wb = new ExcelJS.Workbook()
    wb.creator = 'H+ Hotel Plus Meeting Analyzer'
    wb.created = new Date()

    const ws = wb.addWorksheet('Meeting Records', {
      pageSetup: { fitToPage: true, fitToWidth: 1 },
    })

    // Header style
    const headerFill: ExcelJS.Fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: 'FFF5C800' },
    }
    const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FF000000' }, size: 11 }

    ws.columns = [
      { header: 'ลำดับ',         key: 'no',          width: 8  },
      { header: 'ชื่อการประชุม', key: 'title',        width: 40 },
      { header: 'ประเภท',        key: 'type',         width: 18 },
      { header: 'วันที่',         key: 'date',         width: 22 },
      { header: 'คะแนนรวม',      key: 'score',        width: 12 },
      { header: 'Risk Level',     key: 'risk',         width: 14 },
      { header: 'Sentiment',      key: 'sentiment',    width: 14 },
      { header: 'ผู้วิเคราะห์',   key: 'analyst',      width: 20 },
      { header: 'ผู้เข้าร่วม',    key: 'participants', width: 40 },
      { header: 'Action Items',   key: 'actions',      width: 50 },
      { header: 'สรุป',           key: 'summary',      width: 60 },
      { header: 'Video URL',      key: 'videoUrl',     width: 40 },
    ]

    // Style header row
    ws.getRow(1).eachCell(cell => {
      cell.fill = headerFill
      cell.font = headerFont
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FFD4A800' } },
      }
    })
    ws.getRow(1).height = 28

    const typeLabel = (t: string) =>
      t === 'monthly' ? 'Monthly Meeting' : t === 'pitching' ? 'Pitching' : 'First Meeting'
    const riskLabel = (r: string | null) =>
      r === 'high' ? '🔴 High' : r === 'medium' ? '🟡 Medium' : r === 'low' ? '🟢 Low' : '-'
    const sentimentLabel = (s: string | null) =>
      s === 'positive' ? '😊 Positive' : s === 'negative' ? '😟 Negative' : '😐 Neutral'

    meetings.forEach((m: any, i) => {
      const score = m.salesScore ?? m.meetingScore ?? 0
      const participants = Array.isArray(m.participants)
        ? m.participants.map((p: any) => `${p.name} (${p.role})`).join(', ')
        : ''
      const actionItems = Array.isArray(m.actionItems) ? m.actionItems.join(' | ') : ''

      const row = ws.addRow({
        no:           i + 1,
        title:        m.title,
        type:         typeLabel(m.meetingType),
        date:         new Date(m.meetingDate).toLocaleString('th-TH'),
        score:        score,
        risk:         riskLabel(m.riskLevel),
        sentiment:    sentimentLabel(m.sentimentOverall),
        analyst:      m.user?.name || '-',
        participants: participants,
        actions:      actionItems,
        summary:      m.summary || '',
        videoUrl:     m.videoUrl || '',
      })

      // Color score cell
      const scoreCell = row.getCell('score')
      scoreCell.font = {
        bold: true,
        color: { argb: score >= 80 ? 'FF22C55E' : score >= 60 ? 'FFF59E0B' : 'FFEF4444' },
      }
      scoreCell.alignment = { horizontal: 'center' }

      // Alternate row color
      // if (i % 2 === 0) {
      //   row.eachCell({ includeEmpty: true }, cell => {
      //     if (cell.col !== 5) {
      //       cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A1A' } }
      //     }
      //   })
      // }

      row.alignment = { vertical: 'top', wrapText: true }
      row.height = 30
    })

    // Freeze header
    ws.views = [{ state: 'frozen', ySplit: 1 }]

    // Add summary sheet
    const ws2 = wb.addWorksheet('Summary')
    ws2.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value',  key: 'value',  width: 20 },
    ]
    ws2.getRow(1).font = { bold: true }
    ws2.addRows([
      { metric: 'Total Meetings',    value: meetings.length },
      { metric: 'Avg Score',         value: meetings.length ? Math.round(meetings.reduce((s: number, m: any) => s + (m.meetingScore ?? m.salesScore ?? 0), 0) / meetings.length) : 0 },
      { metric: 'High Risk',         value: meetings.filter((m: any) => m.riskLevel === 'high').length },
      { metric: 'Medium Risk',       value: meetings.filter((m: any) => m.riskLevel === 'medium').length },
      { metric: 'Low Risk',          value: meetings.filter((m: any) => m.riskLevel === 'low').length },
      { metric: 'Monthly Meetings',  value: meetings.filter((m: any) => m.meetingType === 'monthly').length },
      { metric: 'Pitching Meetings', value: meetings.filter((m: any) => m.meetingType === 'pitching').length },
      { metric: 'Export Date',       value: new Date().toLocaleString('th-TH') },
    ])

    const buf = await wb.xlsx.writeBuffer()
    const filename = `meeting-records-${new Date().toISOString().slice(0, 10)}.xlsx`

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
