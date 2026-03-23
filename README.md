# H+ Meeting Analyzer

**Meeting Performance Measurement & Termination Warning System**  

---

## Overview

AI-powered web application สำหรับทีม H+ Hotel Plus ใช้วิเคราะห์ transcript การประชุมกับลูกค้าโรงแรม เพื่อ:
- Score meeting quality across 5 dimensions
- วัดคุณภาพการประชุมแบบ real-time (Thai + English)
- ตรวจจับสัญญาณเสี่ยงการยกเลิกสัญญา
- ประเมินประสิทธิภาพการนำเสนอขาย
- ส่ง email report อัตโนมัติหลังวิเคราะห์เสร็จ
---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 18, Tailwind CSS |
| Backend | Next.js App Router API Routes |
| Database | PostgreSQL + Prisma ORM |
| NLP Engine | Custom Rule-based (Offline, ไม่ใช้ AI API) |
| Speech-to-Text | Groq Whisper (Upload) + AssemblyAI (Drive URL) |
| Email | Resend |
| Auth | Cookie-based Session (ไม่ใช้ NextAuth) |
---


## Quick Start

### 1. ติดตั้ง dependencies
```bash
npm install
```

### 2. ตั้งค่า environment
```bash
cp .env.example .env
```

แก้ไขไฟล์ `.env`:
```env
# Database
DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require"

# Session
SESSION_SECRET="random-string-อย่างน้อย-32-ตัวอักษร"

# Speech-to-Text (ไม่บังคับ แต่ต้องมีเพื่อถอดเสียง)
GROQ_API_KEY="gsk_..."           # console.groq.com (ฟรี)

# Email (ไม่บังคับ แต่ต้องมีเพื่อส่ง report)
RESEND_API_KEY="re_..."          # resend.com (ฟรี 3,000/เดือน)
EMAIL_FROM="noreply@yourdomain.com"
ADMIN_EMAIL="admin@hotelplus.asia"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. สร้าง Database
```bash
npm run db:push     # สร้าง tables
npm run db:seed     # ใส่ demo data + accounts
```

### 4. รัน
```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

---

## Demo Accounts

| ชื่อ | Email | Password | Role |
|---|---|---|---|
| Admin H+ | admin@hotelplus.asia | admin1234 | Admin |
| คุณแบงค์ | bank@hotelplus.asia | member1234 | Member |
| คุณยาย่า | yaya@hotelplus.asia | member1234 | Member |

---

## Features

### 🎯 Meeting Analysis
- **3-step wizard**: Meeting Info → Participants → Transcript
- รองรับ 3 ประเภท: Monthly Meeting, Pitching Meeting, First Meeting
- Input ได้ 2 วิธี: Paste text, Upload File

### 🤖 NLP Engine (Custom, Offline)
วิเคราะห์ด้วย Rule-based engine ที่เขียนเอง ไม่ได้ใช้ AI API

**Meeting Quality Score (0-100)** คำนวณจาก:
| Metric | Weight | วิธีวิเคราะห์ |
|---|---|---|
| Action Items | 25% | Regex จับประโยค "จะ/ต้อง/ควร/ส่ง" |
| Decision Made | 20% | จับ "ตกลง/อนุมัติ/มีมติ" |
| Speaking Balance | 20% | วัด % การพูดของแต่ละ speaker |
| Topic Focus | 20% | ตรวจ off-topic patterns |
| Duration Efficiency | 15% | นับ word count |

**Termination Risk Detection:**
| Level | เงื่อนไข |
|---|---|
| 🔴 High | มี keyword เสี่ยงสูง เช่น "ยกเลิกสัญญา", "ค่าบริการสูง" |
| 🟡 Medium | มีคำพูดเชิงลบ เช่น "ยอดขายตก", "ไม่พอใจ" |
| 🟢 Low | ไม่พบสัญญาณเสี่ยง |

**Sales Effectiveness (Pitching only):**
Presentation Structure + Engagement + Question Quality + Speech Pace

### 🎙️ Speech-to-Text
| วิธี | Engine | หมายเหตุ |
|---|---|---|
| Upload File | Groq Whisper Large v3 Turbo | รองรับ MP4, WebM, MP3, WAV ฯลฯ ถึง 1GB, auto-chunk |
| Google Drive URL | AssemblyAI | ต้อง share "Anyone with link", รองรับภาษาไทย + speaker labels |

### 📊 Dashboard
- Total meetings, Avg score, High/Medium risk count
- Score trend bar chart
- Recent meetings list

### 📋 Meeting Records
- ตารางแสดง meetings ทั้งหมด
- Pagination 10 รายการ/หน้า
- Filter: ค้นหา, ประเภท, Risk Level, ช่วงวันที่
- Export Excel (.xlsx) พร้อม Summary sheet

### 👥 All Users (Admin)
- ดูรายชื่อ users พร้อมจำนวน meetings
- เพิ่ม/แก้ไข/ลบ users
- กำหนด Role: Admin / Member

### ⚙️ Settings
| แท็บ | ฟีเจอร์ |
|---|---|
| โปรไฟล์ | แก้ชื่อ, อีเมล, ดูสถิติ |
| รหัสผ่าน | เปลี่ยนรหัสผ่านพร้อม validation |
| การแจ้งเตือน | Toggle email notifications, ส่ง Weekly Digest |
| API Keys | แสดงสถานะ Groq/AssemblyAI/Resend |
| System | Service status, App info, Danger Zone |

### 📧 Email Reports
- Auto-send หลัง analyze เสร็จทุกครั้ง
- Weekly Digest สรุปการประชุมประจำสัปดาห์
- ใช้ Resend (ฟรี 3,000 email/เดือน)

User submit analysis
      ↓
นำเสนอ NLP engine
      ↓
บันทึก database
      ↓
✅ ตรวจสอบ notificationEnabled
      ↓
ส่ง email report (HTML สวย + dark mode)
      ↓
User ได้ email ทันที 

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts          # POST: NLP วิเคราะห์ + บันทึก DB + ส่ง email
│   │   ├── auth/
│   │   │   ├── login/route.ts        # POST: login
│   │   │   ├── logout/route.ts       # POST: logout
│   │   │   ├── me/route.ts           # GET: current session user
│   │   │   └── register/route.ts     # POST: สมัครสมาชิก
│   │   ├── dashboard/route.ts        # GET: stats + score trend
│   │   ├── email/
│   │   │   └── weekly/route.ts       # GET/POST: send weekly digest
│   │   ├── meetings/
│   │   │   ├── route.ts              # GET: all meetings
│   │   │   └── [id]/route.ts         # GET/DELETE: single meeting
│   │   ├── records/
│   │   │   ├── route.ts              # GET: pagination + filter
│   │   │   └── export/route.ts       # GET: export Excel
│   │   ├── settings/route.ts         # GET/PATCH: profile + config
│   │   ├── transcribe/route.ts       # POST: Groq / AssemblyAI
│   │   └── users/
│   │       ├── route.ts              # GET/POST: users
│   │       └── [id]/route.ts         # PATCH/DELETE: user
│   ├── analyze/                      # New Analysis wizard
│   ├── dashboard/                    # Dashboard + chart
│   ├── login/                        # Login page
│   ├── meetings/[id]/                # Meeting Detail
│   ├── register/                     # Register page
│   ├── settings/                     # Settings (5 tabs)
│   ├── users/                        # All Users CRUD
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                      # Redirect
├── components/ui/
│   ├── Badges.tsx                    # RiskBadge, MeetingTypeBadge, SentimentBadge
│   ├── MetricBar.tsx                 # Progress bar metric
│   ├── ScoreRing.tsx                 # SVG score ring
│   └── Sidebar.tsx                   # Navigation + user + logout
├── lib/
│   ├── ai.ts                         # Custom NLP engine (offline)
│   ├── email.ts                      # Email engine (Resend)
│   ├── prisma.ts                     # Prisma client singleton
│   ├── session.ts                    # Cookie session management
│   └── utils.ts                      # Helpers
├── proxy.ts                          # Auth guard (→ /login)
└── types/index.ts                    # TypeScript interfaces
```

## Speech-to-Text (Groq Whisper)

ระบบใช้ **Groq Whisper Large v3 Turbo** สำหรับแปลงไฟล์วิดีโอ/เสียงเป็น transcript

### ทำไมต้อง Groq ไม่ใช้ OpenAI?
- Groq ฟรี 28,800 วินาที/ชั่วโมง (≈ 8 ชั่วโมงของการประชุม)
- เร็วกว่า OpenAI Whisper API 5-10x
- รองรับภาษาไทย + อังกฤษ เหมือนกัน
- ไม่มีค่าใช้จ่าย สำหรับ usage ปกติ

### ขอ Groq API Key ฟรี
1. ไปที่ https://console.groq.com
2. Sign up → API Keys → Create API Key
3. ใส่ใน .env: `GROQ_API_KEY="gsk_..."`

### รองรับไฟล์
MP4, WebM, MP3, M4A, WAV, OGG, FLAC, MOV (ไม่เกิน 1GB)


### ระบบนี้ใช้ NLP Analysis Engine

transcript (ข้อความการประชุม)
        ↓
NLP อ่านและวิเคราะห์
        ↓
- จับ keyword สำคัญ
- แยกผู้พูด
- หา pattern เสี่ยง
- คำนวณคะแนน
        ↓
ผลลัพธ์: score + risk + insights
----

### การถอดเสียงจาก Google Drive URL ทำไม่ได้เพราะ Google Drive ไม่ใช่ public file server 

มี 3 สาเหตุหลัก

ชั้นที่ 1 — Authentication
Google Drive ต้องการ login ก่อนดาวน์โหลดเสมอ แม้จะ share "Anyone with link" แล้ว server ของเราไม่มี Google session จึงโหลดไม่ได้

ชั้นที่ 2 — Virus Scan Warning
ไฟล์วิดีโอขนาดใหญ่ Google จะแสดงหน้า HTML "Can't scan for viruses" ก่อน แทนที่จะส่งไฟล์มาตรง server จึงได้ HTML กลับมาแทนไฟล์จริง

ชั้นที่ 3 — ลองใช้ AssemblyAI ช่วยโหลดแล้ว ก็โหลดไม่ได้
AssemblyAI ที่รับ URL ไปดาวน์โหลดเองก็ติดปัญหาเดียวกัน เพราะ Google บล็อก bot/server ที่ไม่มี session

วิธีแก้ที่ทำได้
- Download แล้ว Upload File
- แนบลิงค์ Recording Video URL
---


### Email Reports (Resend.com)
- EMAIL_FROM ใน .env ต้องเป็น domain ที่ verify แล้วใน Resend
- ถ้าใช้ domain ที่ยังไม่ verify จะส่งไม่ถึงครับ เช็ค log ที่ resend.com/domains
- ถ้ายังไม่มี domain → ใช้ของ Resend ชั่วคราว (onboarding@resend.dev ใช้ได้เฉพาะ dev/test เท่านั้น ถ้าจะใช้ production จริงต้อง verify domain ของตัวเองใน Resend ครับ)
---


### Deployment Vercel URL
https://meeting-analyzer-mtes.vercel.app/
หมายเหตุ: ลิงก์ทดสอบนี้เน้นการแสดงผลหน้า UI/UX และการเข้าถึงข้อมูลพื้นฐาน เนื่องจากข้อจำกัดด้านการจัดการไฟล์ขนาดใหญ่บน Vercel (Payload Limit) อาจทำให้ฟีเจอร์การอัปโหลดไฟล์บางส่วนยังไม่สามารถทำงานได้สมบูรณ์ 100% ในเวอร์ชัน Demo นี้
---

### ลิงค์นำเสนอ Demo
: https://youtu.be/8HRdxNpV0tw

