import { Resend } from 'resend'
function getResend() {
  return new Resend(process.env.RESEND_API_KEY || 'placeholder')
}

const FROM = process.env.EMAIL_FROM || 'H+ Meeting Analyzer <noreply@hotelplus.asia>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

// ─── Color helpers ────────────────────────────────────────────
function riskColor(level?: string | null) {
  return level === 'high' ? '#EF4444' : level === 'medium' ? '#F59E0B' : '#22C55E'
}
function riskLabel(level?: string | null) {
  return level === 'high' ? '🔴 High Risk' : level === 'medium' ? '🟡 Medium Risk' : '🟢 Low Risk'
}
function scoreColor(score: number) {
  return score >= 80 ? '#22C55E' : score >= 60 ? '#F59E0B' : '#EF4444'
}

// ─── HTML Email Template ──────────────────────────────────────
function buildMeetingReportHtml(meeting: any): string {
  const mainScore = meeting.salesScore ?? meeting.meetingScore ?? 0
  const participants = Array.isArray(meeting.participants) ? meeting.participants : []
  const riskSignals = Array.isArray(meeting.riskSignals) ? meeting.riskSignals : []
  const actionItems = Array.isArray(meeting.actionItems) ? meeting.actionItems : []
  const improvements = Array.isArray(meeting.improvements) ? meeting.improvements : []
  const keyInsights = Array.isArray(meeting.keyInsights) ? meeting.keyInsights : []
  const isPitching = meeting.meetingType === 'pitching'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>Meeting Report — ${meeting.title}</title>
</head>
<body style="margin:0;padding:0;background:#0D0D0D;font-family:'Segoe UI',Arial,sans-serif;color:#E8E8E8;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">

    <!-- Header -->
    <div style="background:#111;border:1px solid #222;border-radius:16px;padding:24px;margin-bottom:16px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <div style="background:#F5C800;color:#000;font-weight:700;font-size:14px;padding:8px 12px;border-radius:8px;">H+</div>
        <div>
          <div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.08em;">H+ Hotel Plus</div>
          <div style="font-size:11px;color:#555;">Meeting Analyzer Report</div>
        </div>
      </div>
      <h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:#fff;">${meeting.title}</h1>
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
        <span style="background:rgba(245,200,0,0.12);color:#F5C800;font-size:11px;padding:3px 10px;border-radius:20px;border:1px solid rgba(245,200,0,0.2);">
          ${meeting.meetingType === 'monthly' ? 'Monthly Meeting' : meeting.meetingType === 'pitching' ? 'Pitching Meeting' : 'First Meeting'}
        </span>
        <span style="font-size:12px;color:#555;">${new Date(meeting.meetingDate).toLocaleDateString('th-TH', { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
      </div>
    </div>

    <!-- Score + Risk -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
      <div style="background:#111;border:1px solid #222;border-radius:12px;padding:20px;text-align:center;">
        <div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">
          ${isPitching ? 'Sales Score' : 'Meeting Score'}
        </div>
        <div style="font-size:42px;font-weight:700;color:${scoreColor(mainScore)};line-height:1;">${mainScore}</div>
        <div style="font-size:12px;color:#555;margin-top:4px;">/100</div>
      </div>
      ${meeting.riskLevel ? `
      <div style="background:#111;border:1px solid ${riskColor(meeting.riskLevel)}33;border-radius:12px;padding:20px;text-align:center;">
        <div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">Risk Level</div>
        <div style="font-size:20px;font-weight:700;color:${riskColor(meeting.riskLevel)};">${riskLabel(meeting.riskLevel)}</div>
        <div style="font-size:12px;color:#555;margin-top:6px;">${riskSignals.length} signal${riskSignals.length !== 1 ? 's' : ''} detected</div>
      </div>` : `
      <div style="background:#111;border:1px solid #222;border-radius:12px;padding:20px;text-align:center;">
        <div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">Sentiment</div>
        <div style="font-size:22px;font-weight:700;color:${meeting.sentimentOverall === 'positive' ? '#22C55E' : meeting.sentimentOverall === 'negative' ? '#EF4444' : '#999'};">
          ${meeting.sentimentOverall === 'positive' ? '😊 Positive' : meeting.sentimentOverall === 'negative' ? '😟 Negative' : '😐 Neutral'}
        </div>
      </div>`}
    </div>

    <!-- Metrics -->
    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:20px;margin-bottom:16px;">
      <div style="font-size:11px;color:#F5C800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:16px;">Quality Metrics</div>
      ${[
        { label: 'Action Items', score: meeting.actionItemsScore },
        { label: 'Decision Made', score: meeting.decisionMadeScore },
        { label: 'Speaking Balance', score: meeting.speakingBalance },
        { label: 'Topic Focus', score: meeting.topicFocusScore },
        { label: 'Duration Efficiency', score: meeting.durationEfficiency },
      ].map(m => `
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="font-size:13px;color:#ccc;">${m.label}</span>
            <span style="font-size:13px;font-weight:600;color:${scoreColor(m.score ?? 0)};">${m.score ?? 0}</span>
          </div>
          <div style="background:#1A1A1A;border-radius:4px;height:6px;overflow:hidden;">
            <div style="background:${scoreColor(m.score ?? 0)};height:100%;width:${m.score ?? 0}%;border-radius:4px;"></div>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Risk Signals -->
    ${riskSignals.length > 0 ? `
    <div style="background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.25);border-radius:12px;padding:20px;margin-bottom:16px;">
      <div style="font-size:11px;color:#EF4444;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px;">⚠️ Risk Signals Detected</div>
      ${riskSignals.map((s: any) => `
        <div style="margin-bottom:8px;padding:10px;background:rgba(239,68,68,0.05);border-radius:8px;">
          <span style="font-size:10px;background:rgba(239,68,68,0.2);color:#EF4444;padding:2px 8px;border-radius:4px;text-transform:uppercase;margin-right:8px;">${s.type?.replace(/_/g, ' ')}</span>
          <span style="font-size:12px;color:#ccc;">"${s.text}"</span>
        </div>
      `).join('')}
    </div>` : ''}

    <!-- Summary -->
    ${meeting.summary ? `
    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:20px;margin-bottom:16px;">
      <div style="font-size:11px;color:#F5C800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;">Summary</div>
      <p style="margin:0;font-size:13px;color:#aaa;line-height:1.7;">${meeting.summary}</p>
    </div>` : ''}

    <!-- Action Items -->
    ${actionItems.length > 0 ? `
    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:20px;margin-bottom:16px;">
      <div style="font-size:11px;color:#22C55E;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px;">✅ Action Items</div>
      ${actionItems.map((item: string) => `
        <div style="display:flex;gap:8px;margin-bottom:8px;">
          <span style="color:#22C55E;font-size:14px;flex-shrink:0;">→</span>
          <span style="font-size:13px;color:#ccc;">${item}</span>
        </div>
      `).join('')}
    </div>` : ''}

    <!-- Improvements -->
    ${improvements.length > 0 ? `
    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:20px;margin-bottom:16px;">
      <div style="font-size:11px;color:#A78BFA;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px;">💡 Improvements</div>
      ${improvements.map((item: string) => `
        <div style="display:flex;gap:8px;margin-bottom:8px;">
          <span style="color:#A78BFA;font-size:14px;flex-shrink:0;">•</span>
          <span style="font-size:13px;color:#ccc;">${item}</span>
        </div>
      `).join('')}
    </div>` : ''}

    <!-- Participants -->
    ${participants.length > 0 ? `
    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:20px;margin-bottom:16px;">
      <div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px;">Participants</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        ${participants.map((p: any) => `
          <span style="font-size:12px;padding:4px 10px;border-radius:20px;border:1px solid ${p.role === 'staff' ? 'rgba(96,165,250,0.3)' : 'rgba(245,200,0,0.3)'};color:${p.role === 'staff' ? '#60A5FA' : '#F5C800'};">
            ${p.name} · ${p.role}
          </span>
        `).join('')}
      </div>
    </div>` : ''}

    <!-- CTA Button -->
    <div style="text-align:center;margin:24px 0 16px;">
      <a href="${appUrl}/meetings/${meeting.id}"
        style="background:#F5C800;color:#000;text-decoration:none;padding:12px 32px;border-radius:12px;font-size:14px;font-weight:700;display:inline-block;">
        ดูรายละเอียดเพิ่มเติม →
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding-top:16px;border-top:1px solid #1A1A1A;">
      <p style="font-size:11px;color:#444;margin:0;">H+ Hotel Plus · Meeting Analyzer · Auto-generated report</p>
    </div>

  </div>
</body>
</html>`
}

// ─── Send meeting report after analysis ──────────────────────
export async function sendMeetingReport(meeting: any, recipientEmail: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] RESEND_API_KEY not configured — skipping email send')
    return
  }
  if (!recipientEmail) {
    console.warn('[Email] No recipient email provided')
    return
  }

  const mainScore = meeting.salesScore ?? meeting.meetingScore ?? 0
  const riskEmoji = meeting.riskLevel === 'high' ? '🔴' : meeting.riskLevel === 'medium' ? '🟡' : '🟢'

  try {
    console.log(`[Email] Sending report to ${recipientEmail}...`)
    await getResend().emails.send({
      from: FROM,
      to: recipientEmail,
      subject: `${riskEmoji} Meeting Report: ${meeting.title} — Score ${mainScore}/100`,
      html: buildMeetingReportHtml(meeting),
    })
    console.log(`[Email] ✅ Report sent successfully to ${recipientEmail}`)
  } catch (err) {
    console.error('[Email] ❌ Failed to send report:', err)
  }
}

// ─── Weekly digest ────────────────────────────────────────────
export async function sendWeeklyDigest(meetings: any[], recipientEmail: string) {
  if (!process.env.RESEND_API_KEY) return
  if (!recipientEmail || meetings.length === 0) return

  const avgScore = Math.round(meetings.reduce((s, m) => s + (m.meetingScore ?? m.salesScore ?? 0), 0) / meetings.length)
  const highRisk = meetings.filter(m => m.riskLevel === 'high').length
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0D0D0D;font-family:'Segoe UI',Arial,sans-serif;color:#E8E8E8;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">

  <!-- Header -->
  <div style="background:#111;border:1px solid #222;border-radius:16px;padding:24px;margin-bottom:16px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
      <div style="background:#F5C800;color:#000;font-weight:700;font-size:14px;padding:8px 12px;border-radius:8px;">H+</div>
      <div>
        <div style="font-size:11px;color:#666;text-transform:uppercase;letter-spacing:.08em;">Weekly Digest</div>
        <div style="font-size:11px;color:#555;">${new Date().toLocaleDateString('th-TH', { year:'numeric', month:'long', day:'numeric' })}</div>
      </div>
    </div>
    <h1 style="margin:0;font-size:20px;font-weight:700;color:#fff;">สรุปการประชุมประจำสัปดาห์</h1>
  </div>

  <!-- Stats -->
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px;">
    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:16px;text-align:center;">
      <div style="font-size:28px;font-weight:700;color:#F5C800;">${meetings.length}</div>
      <div style="font-size:11px;color:#555;margin-top:4px;">Total Meetings</div>
    </div>
    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:16px;text-align:center;">
      <div style="font-size:28px;font-weight:700;color:${avgScore >= 80 ? '#22C55E' : avgScore >= 60 ? '#F59E0B' : '#EF4444'};">${avgScore}</div>
      <div style="font-size:11px;color:#555;margin-top:4px;">Avg Score</div>
    </div>
    <div style="background:${highRisk > 0 ? 'rgba(239,68,68,0.07)' : '#111'};border:1px solid ${highRisk > 0 ? 'rgba(239,68,68,0.3)' : '#222'};border-radius:12px;padding:16px;text-align:center;">
      <div style="font-size:28px;font-weight:700;color:${highRisk > 0 ? '#EF4444' : '#22C55E'};">${highRisk}</div>
      <div style="font-size:11px;color:#555;margin-top:4px;">High Risk</div>
    </div>
  </div>

  <!-- Meeting list -->
  <div style="background:#111;border:1px solid #222;border-radius:12px;padding:20px;margin-bottom:16px;">
    <div style="font-size:11px;color:#F5C800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:16px;">รายการประชุม</div>
    ${meetings.map(m => {
      const score = m.salesScore ?? m.meetingScore ?? 0
      const risk = m.riskLevel === 'high' ? '🔴' : m.riskLevel === 'medium' ? '🟡' : m.riskLevel === 'low' ? '🟢' : ''
      return `
      <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #1A1A1A;">
        <div style="width:44px;height:44px;border-radius:10px;background:${scoreColor(score)}18;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:${scoreColor(score)};flex-shrink:0;">${score}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m.title}</div>
          <div style="font-size:11px;color:#555;margin-top:2px;">${new Date(m.meetingDate).toLocaleDateString('th-TH')} ${risk}</div>
        </div>
        <a href="${appUrl}/meetings/${m.id}" style="font-size:11px;color:#F5C800;text-decoration:none;flex-shrink:0;">ดู →</a>
      </div>`
    }).join('')}
  </div>

  <!-- CTA -->
  <div style="text-align:center;margin:24px 0 16px;">
    <a href="${appUrl}/dashboard" style="background:#F5C800;color:#000;text-decoration:none;padding:12px 32px;border-radius:12px;font-size:14px;font-weight:700;display:inline-block;">
      ดู Dashboard →
    </a>
  </div>

  <div style="text-align:center;padding-top:16px;border-top:1px solid #1A1A1A;">
    <p style="font-size:11px;color:#444;margin:0;">H+ Hotel Plus · Meeting Analyzer · Weekly Digest</p>
  </div>
</div>
</body>
</html>`

  function scoreColor(score: number) {
    return score >= 80 ? '#22C55E' : score >= 60 ? '#F59E0B' : '#EF4444'
  }

  try {
    await getResend().emails.send({
      from: FROM,
      to: recipientEmail,
      subject: `📊 Weekly Digest — ${meetings.length} meetings, avg ${avgScore}/100${highRisk > 0 ? `, ${highRisk} high risk` : ''}`,
      html,
    })
    console.log(`[Email] Weekly digest sent to ${recipientEmail}`)
  } catch (err) {
    console.error('[Email] Failed to send weekly digest:', err)
  }
}
