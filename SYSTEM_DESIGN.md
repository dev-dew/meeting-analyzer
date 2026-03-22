# System Design Document
## H+ Meeting Analyzer — H+ Hotel Plus

---

## System Design

### Architecture

ระบบออกแบบเป็น **Monolithic Next.js Application** ที่รวม Frontend, Backend, และ NLP Engine ไว้ในที่เดียว เหมาะกับขนาดองค์กรปัจจุบัน deploy ง่าย ดูแลง่าย

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                            │
│                                                                  │
│  Pages: Login / Dashboard / Analyze / Records / Users / Settings│
│  React (Client Components) + Next.js SSR (Server Components)    │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────────┐
│                     NEXT.JS APP ROUTER                           │
│                                                                  │
│  Middleware (proxy.ts) ── Auth Guard ── redirect /login         │
│                                                                  │
│  API Routes:                                                     │
│  POST /api/analyze          → รับ transcript → NLP → DB → Email │
│  POST /api/transcribe       → รับไฟล์/URL → STT → คืน text    │
│  GET  /api/records          → ดึง meetings + pagination         │
│  GET  /api/records/export   → สร้าง Excel file                  │
│  GET  /api/dashboard        → stats + trend data                │
│  POST /api/auth/login       → verify password → set cookie      │
│  GET/PATCH /api/settings    → profile + config                  │
│  GET/POST  /api/users       → user management (admin only)      │
│  GET  /api/email/weekly     → trigger weekly digest             │
└──────┬──────────┬───────────┬──────────────────────────────────┘
       │          │           │
┌──────▼───┐ ┌───▼──────┐ ┌──▼────────────────────────────────┐
│  Custom  │ │ Speech-  │ │         POSTGRESQL DATABASE         │
│  NLP     │ │ to-Text  │ │         (Neon / Railway)            │
│  Engine  │ │          │ │                                     │
│          │ │ • Groq   │ │  Tables:                            │
│ Offline  │ │   Whisper│ │  ├── users                         │
│ No API   │ │   (file) │ │  └── meetings                      │
│          │ │ • Assembly│ │                                    │
│ ~50ms    │ │   AI(URL)│ │  Prisma ORM                        │
└──────────┘ └──────────┘ └────────────────────────────────────┘
                                        │
                               ┌────────▼────────┐
                               │   Resend API     │
                               │  Email Reports   │
                               │  Weekly Digest   │
                               └─────────────────┘
```

**Request Flow — การวิเคราะห์ Meeting:**
```
1. User วาง transcript / upload file / ใส่ Drive URL
2. (ถ้าเป็นไฟล์/URL) → POST /api/transcribe → Groq หรือ AssemblyAI → คืน text
3. User กด "วิเคราะห์" → POST /api/analyze
4. Server รัน Custom NLP Engine (~50ms, offline)
5. บันทึกผลลัพธ์ทั้งหมดลง PostgreSQL
6. ส่ง email report ให้ user + admin (fire-and-forget)
7. Redirect ไปหน้า Meeting Detail
```

---

### Data Model

**users table**
```sql
users (
  id          CUID PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,           -- bcrypt hash (12 rounds)
  role        TEXT DEFAULT 'member',   -- admin | member
  createdAt   TIMESTAMP DEFAULT NOW(),
  updatedAt   TIMESTAMP
)
```

**meetings table**
```sql
meetings (
  id            CUID PRIMARY KEY,
  title         TEXT NOT NULL,
  meetingType   TEXT,                  -- monthly | pitching | first_meeting
  participants  JSONB,                 -- [{name: string, role: "staff"|"client"}]
  meetingDate   TIMESTAMP,
  transcript    TEXT,                  -- full transcript text
  inputMethod   TEXT,                  -- paste | upload | drive
  videoUrl      TEXT,                  -- Google Drive / Zoom link (optional)
  createdBy     TEXT REFERENCES users(id),

  -- Meeting Quality Scores (0-100)
  meetingScore        INT,
  actionItemsScore    INT,
  decisionMadeScore   INT,
  speakingBalance     INT,
  topicFocusScore     INT,
  durationEfficiency  INT,

  -- Termination Risk (monthly / first_meeting only)
  riskLevel     TEXT,                  -- low | medium | high
  riskSignals   JSONB,                 -- [{text, type, severity}]

  -- Sales Effectiveness (pitching only)
  salesScore              INT,
  presentationStructure   INT,
  engagementScore         INT,
  questionQualityScore    INT,
  speechPaceScore         INT,

  -- NLP Outputs
  summary          TEXT,
  keyInsights      JSONB,              -- string[]
  actionItems      JSONB,              -- string[]
  improvements     JSONB,              -- string[]
  sentimentOverall TEXT,               -- positive | neutral | negative

  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP
)
```

**Relationships:**
```
users 1 ────── N meetings (createdBy)
```

**ทำไมใช้ JSONB สำหรับบาง fields:**
- `participants` — จำนวนผู้เข้าร่วมไม่แน่นอน ไม่คุ้มสร้าง table แยก
- `riskSignals` — structure ซับซ้อน (text + type + severity) query น้อย
- `keyInsights / actionItems / improvements` — array of strings ที่ต้องการความยืดหยุ่น

---

### Reasoning Behind Meeting Score

**ทำไมต้องมี Meeting Score?**
ทีม H+ Hotel Plus มีการประชุมหลายสิบครั้งต่อเดือน หัวหน้าทีมไม่สามารถนั่งฟังทุกครั้งได้ Meeting Score ทำหน้าที่เป็น "health indicator" ที่บอกในเชิงตัวเลขว่าการประชุมครั้งนั้นมีประสิทธิภาพแค่ไหน

**5 Dimensions และ Reasoning:**

| Dimension | Weight | เหตุผลที่เลือก |
|---|---|---|
| Action Items | **25%** | การประชุมที่ดีต้องมี next steps ชัดเจน มิฉะนั้นเป็นแค่การพูดคุย |
| Decision Made | **20%** | การตัดสินใจคือผลลัพธ์ที่สำคัญที่สุดของการประชุม |
| Speaking Balance | **20%** | ถ้าคนพูดคนเดียว แสดงว่าไม่ได้รับ input จากทุกฝ่าย |
| Topic Focus | **20%** | การหลุดประเด็นบ่อยทำให้เสียเวลาและไม่ได้ข้อสรุป |
| Duration Efficiency | **15%** | เวลาเป็นทรัพยากรสำคัญ ประชุมสั้นหรือยาวเกินไปล้วนไม่ดี |

**วิธีคำนวณแต่ละ Dimension:**

```
Action Items Score:
  → ใช้ Regex จับประโยคที่มีคำว่า "จะ/ต้อง/ควร/ส่ง/ติดตาม/follow up/deadline"
  → score = min(100, 40 + จำนวน_items × 15)
  → ยิ่งมี action items ชัดเจนมาก ยิ่งได้คะแนนสูง

Decision Made Score:
  → จับคำว่า "ตกลง/อนุมัติ/มีมติ/agree/confirmed/decided"
  → score = min(100, 35 + จำนวน_decisions × 20)

Speaking Balance Score:
  → แยก speaker จาก pattern "ชื่อ: ข้อความ"
  → วัด % ของแต่ละ speaker
  → deviation = ผลต่างจาก % ที่ควรเป็น (100/จำนวนคน)
  → score = max(20, 100 - deviation × 200)
  → 100 = ทุกคนพูดเท่ากัน, ต่ำ = คนพูดคนเดียว

Topic Focus Score:
  → ตรวจหา off-topic keywords
  → score = max(30, 90 - (off_topic_count/total_lines) × 300)

Duration Efficiency Score:
  → นับ word count ของ transcript
  → < 50 คำ = 40 (สั้นเกินไป)
  → 200-1500 คำ = 65-95 (เหมาะสม)
  → > 3000 คำ = 55 (ยาวเกินไป)
```

**Final Meeting Score:**
```
Meeting Score = (ActionItems × 0.25) + (Decision × 0.20) +
               (Balance × 0.20) + (Focus × 0.20) + (Duration × 0.15)
```

**Risk Level Classification:**

ระบบตรวจจับ keyword 5 หมวดทั้งภาษาไทยและอังกฤษ:

| หมวด | Severity | ตัวอย่าง keyword |
|---|---|---|
| contract_risk | High | ยกเลิกสัญญา, ไม่ต่อสัญญา, cancel contract |
| price_complaint | High | ค่าบริการสูง, แพงไป, not worth |
| sales_decline | Medium | ยอดขายตก, revenue down, ไม่ถึงเป้า |
| dissatisfaction | Medium | ไม่พอใจ, disappointed, ไม่ work |
| urgency_warning | Medium | ครั้งสุดท้าย, last chance, must improve |

```
High Risk   = มี high-severity signal ≥ 1 ครั้ง หรือ signals รวม ≥ 3
Medium Risk = มี medium-severity signal ≥ 1 ครั้ง หรือ signals รวม ≥ 2
Low Risk    = ไม่พบ signal หรือพบ low-severity เพียง 1
```

**Sales Score (Pitching Meeting เท่านั้น):**

```
Presentation Structure = มี intro + problem + solution + pricing + CTA หรือไม่
Engagement Score       = จำนวนคำถามที่ลูกค้าถาม (ยิ่งมากยิ่งสนใจ)
Question Quality       = staff ตอบ objection ได้ดีแค่ไหน
Speech Pace            = ความยาวเฉลี่ยต่อบรรทัด (proxy สำหรับ pace)

Sales Score = avg(Structure, Engagement, Quality, Pace)
```

---

## Future Improvements & Scale Plan

### คำถาม: ถ้าจะใช้จริงกับองค์กร 10+ meetings ต่อวัน จะ scale อย่างไร?

---

### สถานการณ์ปัจจุบัน (MVP)

```
User → POST /api/analyze → NLP Engine (~50ms) → DB → Response
```

ทำงานแบบ **Synchronous** รองรับได้ **~50 meetings/วัน** โดยไม่มีปัญหา

ปัญหาที่จะเจอเมื่อ scale:
- NLP offline เร็วมาก แต่ถ้าเพิ่ม AI API จะช้า 3-30 วินาที
- Upload ไฟล์วิดีโอขนาดใหญ่กิน memory server
- หลายคนส่งพร้อมกันทำให้ response ช้า

---

### Phase 1 — 10-50 meetings/วัน (ทำได้ทันที)

**1. Database Indexes**
```sql
-- เพิ่ม index ที่ใช้บ่อย
CREATE INDEX idx_meetings_date   ON meetings(meetingDate DESC);
CREATE INDEX idx_meetings_risk   ON meetings(riskLevel);
CREATE INDEX idx_meetings_type   ON meetings(meetingType);
CREATE INDEX idx_meetings_user   ON meetings(createdBy);
```
ผลลัพธ์: query เร็วขึ้น 10-100x

**2. Cache Dashboard Stats (Redis)**
```
GET /api/dashboard
  → Redis cache hit?  → คืนค่าทันที (< 1ms)
  → cache miss?       → query DB → cache 5 นาที → คืนค่า
```
ประหยัด DB query ได้ 90%+ เพราะ dashboard ถูก load บ่อยมาก

**3. ย้าย File Processing ออกจาก API Route**
```
ปัจจุบัน: Upload → Server memory → Groq API (block request)
เปลี่ยนเป็น: Upload → S3/R2 → background job → notify user
```

---

### Phase 2 — 50-200 meetings/วัน

**1. Async Queue (BullMQ + Redis)**

ปัญหาหลัก: ถ้าใช้ AI API (Groq/AssemblyAI) แต่ละ job ใช้เวลา 10-60 วินาที ถ้า 10 คนส่งพร้อมกัน user คนสุดท้ายรอ 10 นาที

```
User submit transcript
  ↓
POST /api/analyze
  ↓ บันทึก status = "processing"
  ↓ ส่ง jobId กลับทันที (< 100ms)
  ↓
BullMQ Queue
  ↓
Worker Process (background)
  ↓ รัน NLP
  ↓ บันทึกผล DB (status = "done")
  ↓
Frontend polling GET /api/jobs/[jobId]
  หรือ WebSocket push แจ้งเตือน
```

**2. Connection Pooling**
```
Next.js instances → PgBouncer → PostgreSQL
                 (pool 100 connections)
```
ป้องกัน "too many connections" เมื่อ traffic สูง

**3. Read Replica**
```
Write operations → Primary DB
Read operations  → Replica DB
(dashboard, records, search)
```

---

### Phase 3 — 200+ meetings/วัน (Enterprise)

**1. Horizontal Scaling**
```
                    Load Balancer
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   Next.js #1       Next.js #2       Next.js #3
        │                │                │
        └────────────────┼────────────────┘
                         │
              Shared: Redis + PostgreSQL
```
Vercel auto-scale ทำให้โดยอัตโนมัติ

**2. แยก Services**
```
meeting-analyzer-web     → UI + Auth + API routing
meeting-analyzer-worker  → NLP processing + STT
meeting-analyzer-notify  → Email + LINE + Slack alerts
```
แต่ละ service scale แยกกันได้ตามความต้องการ

**3. Real-time Notifications**
```
ปัจจุบัน:  User refresh หน้าเพื่อดูผล
เปลี่ยนเป็น: Server-Sent Events หรือ WebSocket
            → แจ้งเตือนทันทีที่ประมวลผลเสร็จ
```

**4. Observability**
```
Logging:  Winston → CloudWatch / Datadog
Metrics:  meetings/day, avg_processing_time, error_rate
Alerts:   PagerDuty เมื่อ queue > threshold
```

---

### สรุป Roadmap

```
วันนี้              Phase 1           Phase 2           Phase 3
MVP             →  Indexes+Cache  →  Queue+Pool    →  Microservices
~50 mtg/วัน        ~200 mtg/วัน      ~500 mtg/วัน      Unlimited
1 server            1 server          2-3 servers       N servers
Sync (~50ms)        Sync+Cache        Async Queue       Async+Realtime
```

แต่ละ Phase รองรับการเติบโต 4-5x จาก Phase ก่อนหน้า โดยไม่ต้อง rewrite โค้ดทั้งหมด เพียงแค่เพิ่ม infrastructure layers ครับ

---

### Feature Improvements ที่ยังไม่ได้ทำ

| Feature | ประโยชน์ต่อธุรกิจ | ความยาก |
|---|---|---|
| Google OAuth + Drive API | ดาวน์โหลดไฟล์ Meet ได้ตรง ไม่ต้อง download ก่อน | กลาง |
| LINE / Slack Alert | แจ้งเตือน High Risk ทันทีผ่านช่องทางที่ทีมใช้อยู่ | ง่าย |
| AI-powered NLP (LLM) | วิเคราะห์ละเอียดขึ้น เข้าใจ context มากขึ้น | กลาง |
| Trend Analysis per Client | ติดตาม risk score ของลูกค้าแต่ละรายในระยะยาว | กลาง |
| Custom Scoring Weights | Admin ปรับ weight metric ได้ตามบริบทของทีม | ง่าย |
| CRM Integration | ผูก meeting กับข้อมูลลูกค้าโรงแรมในระบบ | ยาก |
| Speech Diarization | แยกเสียงผู้พูดอัตโนมัติจากไฟล์เสียง | กลาง |
| Mobile App | ทีมงานเพิ่ม meeting จากมือถือได้ทันที | ยาก |
