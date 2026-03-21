# H+ Meeting Analyzer

**Meeting Performance Measurement & Termination Warning System**  

---

## Overview

AI-powered web application that analyzes hotel client meeting transcripts to:
- Score meeting quality across 5 dimensions
- Detect contract termination risk signals (Thai + English)
- Evaluate sales pitching effectiveness  
- Display a real-time dashboard with trend charts and risk alerts

---

## Tech Stack

| Layer      | Technology                      |
|------------|----------------------------------|
| Frontend   | Next.js 16, React 18, Tailwind CSS |
| Backend    | Next.js App Router API Routes    |
| Database   | PostgreSQL + Prisma ORM          |
| AI / NLP   | Anthropic Claude (claude-sonnet-4) |
| Charts     | Recharts                         |
| Deploy     | Vercel                            |

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Anthropic API key

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/meeting_analyzer"
ANTHROPIC_API_KEY="sk-ant-your-key-here"
```

### 3. Set up database
```bash
npm run db:push       # Push schema to DB
npm run db:seed       # Seed demo meetings (optional)
```

### 4. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Features

### 📊 Dashboard
- Total meetings count
- Average meeting score
- Risk alert counters (High / Medium / Low)
- Score trend bar chart
- Quick links to recent meetings

### ✨ New Meeting Analysis
3-step wizard:
1. **Meeting Info** — Title, type (Monthly / Pitching / First Meeting), date
2. **Participants** — Names and roles (Staff / Client)
3. **Transcript** — Paste text or enter URL + notes

### 🤖 AI Analysis (Claude)
- **Meeting Quality Score** (0–100) from 5 metrics:
  - Action Items clarity
  - Decision Made quality
  - Speaking Balance
  - Topic Focus
  - Duration Efficiency
- **Termination Warning** (Monthly/First Meeting only):
  - Risk Level: Low / Medium / High
  - Detected risk signals with severity
  - Highlighted dangerous phrases in transcript
- **Sales Effectiveness** (Pitching only):
  - Presentation Structure
  - Engagement Score
  - Question Quality
  - Speech Pace

### 📋 Meeting Detail
- Full transcript with risk highlights
- Action items, key insights, improvement suggestions
- Participant breakdown (Staff vs Client)
- Sentiment analysis

---

## Scoring Methodology

### Meeting Quality Score
Weighted average of 5 metrics (each 0–100):
```
Meeting Score = avg(actionItems, decisionMade, speakingBalance, topicFocus, durationEfficiency)
```

### Risk Level Classification
| Level  | Criteria |
|--------|---------|
| Low    | No complaints, positive tone, no cancel signals |
| Medium | Minor negative language, some concerns expressed |
| High   | Contract cancel keywords, price complaints, disengagement signals |

**Risk Keywords (Thai/English):**
- ยกเลิกสัญญา, ไม่ต่อสัญญา → Contract cancel
- ยอดขายตก, ยอดจองน้อย → Sales decline
- ค่าบริการสูง, แพงเกินไป → Price complaint
- จะขอกลับไปทำเอง → Self-service intent
- ไม่พอใจ, ผิดหวัง → Dissatisfaction

### Sales Effectiveness Score
```
Sales Score = avg(presentationStructure, engagement, questionQuality, speechPace)
```

---

## Deployment

### Vercel (Recommended)
```bash
vercel --prod
```

Set environment variables in Vercel dashboard:
- `DATABASE_URL` — PostgreSQL connection string
- `ANTHROPIC_API_KEY` — Your Anthropic API key

### Database options
- **Railway** — `railway up` (auto-detects PostgreSQL)
- **Supabase** — Free tier, copy connection string
- **Neon** — Serverless PostgreSQL

---

## Scaling for 10+ Meetings/Day

Current architecture handles ~50 meetings/day without changes.

For production scale:

1. **Queue system** — Add BullMQ/Redis to process AI analysis async
2. **Caching** — Cache dashboard stats with Redis (TTL: 5 min)
3. **DB indexes** — Add on `meetingDate`, `riskLevel`, `meetingType`
4. **CDN** — Deploy on Vercel Edge for global low-latency
5. **Rate limiting** — Per-user API limits on `/api/analyze`
6. **Webhook alerts** — Slack/LINE notification when high risk detected

```
Meeting → Queue → AI Worker → DB → Notify
              ↓
          Retry on fail
```

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts     # POST: AI analysis
│   │   ├── meetings/route.ts    # GET: all meetings
│   │   ├── meetings/[id]/       # GET/DELETE single
│   │   └── dashboard/route.ts  # GET: stats
│   ├── dashboard/               # Main dashboard
│   ├── analyze/                 # New meeting wizard
│   └── meetings/                # List + detail views
├── components/
│   └── ui/                      # Sidebar, ScoreRing, Badges, MetricBar
├── lib/
│   ├── ai.ts                    # Anthropic Claude integration
│   ├── prisma.ts               # DB client
│   └── utils.ts                # Helpers
└── types/index.ts               # TypeScript types
```

## Authentication

The app uses a session-based auth system (iron-session compatible, no NextAuth dependency).

### Demo Accounts (after db:seed)
| Name | Email | Password | Role |
|------|-------|----------|------|
| Admin H+ | admin@hotelplus.asia | admin1234 | admin |
| คุณแบงค์ | bank@hotelplus.asia | member1234 | member |
| คุณยาย่า | yaya@hotelplus.asia | member1234 | member |

### User Features
- Each meeting is linked to the user who created it
- "Analyzed by [name]" shown on all meeting cards
- Video URL field — attach Google Drive / Zoom link to each meeting
- Logout from sidebar user panel
- Register new accounts via /register

---

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
