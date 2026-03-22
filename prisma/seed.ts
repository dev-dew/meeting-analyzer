import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create demo users
  const adminPass = await bcrypt.hash('admin1234', 12)
  const memberPass = await bcrypt.hash('member1234', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@hotelplus.asia' },
    update: { notificationEnabled: true },
    create: { name: 'Admin H+', email: 'admin@hotelplus.asia', password: adminPass, role: 'admin', notificationEnabled: true },
  })

  const bank = await prisma.user.upsert({
    where: { email: 'bank@hotelplus.asia' },
    update: { notificationEnabled: true },
    create: { name: 'คุณแบงค์', email: 'bank@hotelplus.asia', password: memberPass, role: 'member', notificationEnabled: true },
  })

  const yaya = await prisma.user.upsert({
    where: { email: 'yaya@hotelplus.asia' },
    update: { notificationEnabled: true },
    create: { name: 'คุณยาย่า', email: 'yaya@hotelplus.asia', password: memberPass, role: 'member', notificationEnabled: true },
  })

  // Seed demo meetings
  await prisma.meeting.createMany({
    skipDuplicates: true,
    data: [
      {
        title: 'Monthly Sync Up – One Sakhon Nakon Hotel',
        meetingType: 'monthly',
        participants: [
          { name: 'คุณแบงค์', role: 'staff' },
          { name: 'คุณนิพัทธ์', role: 'client' },
          { name: 'คุณแมงมุม', role: 'client' },
          { name: 'คุณบิว', role: 'client' },
        ],
        meetingDate: new Date('2025-09-11T13:01:00'),
        transcript: `คุณแบงค์: สวัสดีครับ วันนี้เราจะมาสรุปผลการดำเนินงานประจำเดือนกันนะครับ\nคุณนิพัทธ์: สวัสดีครับ ยอดจองช่วงนี้ดูเหมือนจะตกลงมานิดหน่อยนะครับ\nคุณแมงมุม: ใช่ค่ะ รู้สึกว่ายอดขายช่วงนี้ตกลงมากเลยค่ะ พอจะมีโปรโมชั่นอะไรช่วงนี้ไหมคะ\nคุณแบงค์: ครับ เรามีแผนโปรโมชั่นช่วงปลายปีครับ\nคุณบิว: ค่าบริการของทีมสูงไปหน่อยไหมครับ เมื่อเทียบกับผลลัพธ์ที่ได้\nคุณแบงค์: เข้าใจครับ เรามี ROI report ให้ดูนะครับ\nคุณนิพัทธ์: ผมอาจจะขอกลับไปคิดดูก่อนนะครับว่าจะต่อสัญญาหรือเปล่า\nคุณแบงค์: ได้ครับ เราจะจัดทำ proposal ใหม่ให้ดูนะครับ`,
        inputMethod: 'paste',
        videoUrl: 'https://drive.google.com/file/d/1DpyZnsTvuNVrFipC2iSn-jMSioICItYF/view',
        createdBy: bank.id,
        meetingScore: 58, actionItemsScore: 70, decisionMadeScore: 40,
        speakingBalance: 65, topicFocusScore: 60, durationEfficiency: 75,
        riskLevel: 'high',
        riskSignals: [
          { text: 'ยอดขายช่วงนี้ตกลงมากเลยค่ะ', type: 'sales_decline', severity: 'medium' },
          { text: 'ค่าบริการของทีมสูงไปหน่อยไหมครับ', type: 'price_complaint', severity: 'high' },
          { text: 'อาจจะขอกลับไปคิดดูก่อนนะครับว่าจะต่อสัญญาหรือเปล่า', type: 'contract_risk', severity: 'high' },
        ],
        summary: 'การประชุมประจำเดือนกับโรงแรม One Sakhon Nakon มีสัญญาณเสี่ยงสูงในการยกเลิกสัญญา',
        keyInsights: ['ยอดจองลดลงจากเดือนก่อน', 'ลูกค้ากังวลเรื่อง ROI', 'มีแนวโน้มไม่ต่อสัญญา'],
        actionItems: ['ส่ง ROI Report ภายใน 3 วัน', 'จัดทำแพ็กเกจราคาใหม่', 'ทำ campaign โปรโมชั่นปลายปี'],
        improvements: ['ควรเตรียม ROI data ก่อนประชุม', 'ควรมีข้อเสนอรักษาลูกค้าล่วงหน้า'],
        sentimentOverall: 'negative',
      },
      {
        title: 'Monthly Snapshot – Chiangkhan River Green Hill',
        meetingType: 'monthly',
        participants: [
          { name: 'คุณยาย่า', role: 'staff' },
          { name: 'คุณโอม', role: 'staff' },
          { name: 'คุณเชอร์รี่', role: 'staff' },
          { name: 'คุณเจมส์', role: 'staff' },
          { name: 'คุณแนน', role: 'client' },
        ],
        meetingDate: new Date('2025-08-29T13:16:00'),
        transcript: `คุณยาย่า: สวัสดีค่ะ วันนี้มาสรุปผลเดือนสิงหาคมนะคะ\nคุณแนน: สวัสดีค่ะ เดือนนี้ยอดดีขึ้นมากเลยนะคะ ขอบคุณทีมมากค่ะ\nคุณโอม: ครับ เราเพิ่ม rate บน Booking.com และ Agoda ทำให้ RevPAR ขึ้น 15%\nคุณแนน: ดีใจมากเลยค่ะ อยากให้ช่วยดู package ช่วง high season ด้วยนะคะ\nคุณเชอร์รี่: ได้เลยค่ะ เราจะจัดทำ proposal สำหรับ Oct-Dec ให้ค่ะ\nคุณแนน: โอเคค่ะ รอดูผลนะคะ ถ้าดีแบบนี้ต่อเนื่องก็ต่อสัญญาแน่นอนค่ะ`,
        inputMethod: 'paste',
        videoUrl: 'https://drive.google.com/file/d/1ZRxmbg5z_R_B2UHh4g6p4KEQbINb-Dg4/view',
        createdBy: yaya.id,
        meetingScore: 85, actionItemsScore: 90, decisionMadeScore: 85,
        speakingBalance: 80, topicFocusScore: 88, durationEfficiency: 82,
        riskLevel: 'low', riskSignals: [],
        summary: 'การประชุมประจำเดือนกับ Chiangkhan River Green Hill เป็นไปในเชิงบวก RevPAR เพิ่ม 15%',
        keyInsights: ['RevPAR เพิ่มขึ้น 15%', 'ลูกค้าพอใจกับผลงาน', 'มีแผนขยายงาน high season'],
        actionItems: ['จัดทำ High Season Package Oct-Dec', 'วางแผน Social Content Strategy'],
        improvements: ['อาจเพิ่ม upsell opportunities', 'ควร set KPI ที่ชัดเจนสำหรับ high season'],
        sentimentOverall: 'positive',
      },
      {
        title: 'Sutin Guesthouse – First Pitching',
        meetingType: 'pitching',
        participants: [
          { name: 'คุณเกล', role: 'staff' },
          { name: 'คุณแดเนียล', role: 'client' },
        ],
        meetingDate: new Date('2025-12-02T16:26:00'),
        transcript: `คุณเกล: สวัสดีครับ คุณแดเนียล ยินดีที่ได้พบครับ\nคุณแดเนียล: สวัสดีครับ อยากรู้ว่าบริการของคุณจะช่วยเพิ่มยอดจองได้ยังไงครับ\nคุณเกล: เราช่วยบริหาร OTA ครับ เพิ่ม rate อย่างมีกลยุทธ์ ทำให้ RevPAR สูงขึ้น\nคุณแดเนียล: แล้วค่าใช้จ่ายเป็นยังไงครับ\nคุณเกล: มีหลาย package ครับ ขึ้นอยู่กับขนาดโรงแรมและบริการที่ต้องการ\nคุณแดเนียล: ขอรายละเอียดเพิ่มเติมได้ไหมครับ เรื่อง ROI และ case study\nคุณเกล: แน่นอนครับ จะส่ง proposal ให้ภายในสัปดาห์นี้ครับ`,
        inputMethod: 'paste',
        videoUrl: null,
        createdBy: bank.id,
        meetingScore: 62, actionItemsScore: 65, decisionMadeScore: 55,
        speakingBalance: 70, topicFocusScore: 68, durationEfficiency: 72,
        salesScore: 59, presentationStructure: 70, engagementScore: 60,
        questionQualityScore: 65, speechPaceScore: 40,
        summary: 'การนำเสนอขายครั้งแรกกับ Sutin Guesthouse ยังไม่สามารถปิดการขายได้',
        keyInsights: ['ลูกค้าสนใจบริการ', 'ต้องการ ROI case study', 'ยังไม่ได้ข้อตกลง'],
        actionItems: ['ส่ง Proposal พร้อม ROI Data', 'เตรียม Case Study โรงแรมขนาดเล็ก'],
        improvements: ['ควรเตรียม pricing structure ที่ชัดเจน', 'ควรมี case study พร้อมนำเสนอทันที'],
        sentimentOverall: 'neutral',
      },
    ],
  })

  console.log('✅ Seed completed!')
  console.log('')
  console.log('Demo accounts:')
  console.log('  Admin:  admin@hotelplus.asia  / admin1234')
  console.log('  Staff:  bank@hotelplus.asia   / member1234')
  console.log('  Staff:  yaya@hotelplus.asia   / member1234')
}

main().catch(console.error).finally(() => prisma.$disconnect())
