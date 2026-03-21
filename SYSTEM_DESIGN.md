# System Design Document
## H+ Meeting Analyzer

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT BROWSER                        │
│  Next.js (React) – SSR + Client Components              │
│  Dashboard / Analyze / Meetings / Detail                 │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP / API Routes
┌──────────────────────▼──────────────────────────────────┐
│                  NEXT.JS API ROUTES                      │
│  POST /api/analyze     → AI analysis + DB write         │
│  GET  /api/meetings    → List all meetings              │
│  GET  /api/meetings/[id] → Single meeting detail        │
│  GET  /api/dashboard   → Aggregated stats               │
└──────────┬────────────────────────┬────────────────────┘
           │                        │
┌──────────▼──────────┐  ┌─────────▼─────────────────────┐
│   ANTHROPIC API      │  │      POSTGRESQL DATABASE       │
│   claude-sonnet-4    │  │      (via Prisma ORM)          │
│                      │  │                                │
│  Input:              │  │  Table: meetings               │
│  - Transcript text   │  │  - Scores (all metrics)       │
│  - Meeting type      │  │  - Risk signals (JSONB)       │
│  - Participants      │  │  - Transcript (TEXT)          │
│                      │  │  - AI outputs (JSONB)         │
│  Output:             │  │                                │
│  - Scores JSON       │  └───────────────────────────────┘
│  - Risk signals      │
│  - Summary           │
│  - Insights          │
└─────────────────────┘
```

---

## Data Model

### Meeting Table
```sql
meetings (
  id              CUID PRIMARY KEY,
  title           TEXT NOT NULL,
  meetingType     TEXT,           -- monthly | pitching | first_meeting
  participants    JSONB,          -- [{name, role}]
  meetingDate     TIMESTAMP,
  transcript      TEXT,
  inputMethod     TEXT,

  -- Quality Scores (0-100)
  meetingScore        INT,
  actionItemsScore    INT,
  decisionMadeScore   INT,
  speakingBalance     INT,
  topicFocusScore     INT,
  durationEfficiency  INT,

  -- Termination Risk
  riskLevel       TEXT,           -- low | medium | high
  riskSignals     JSONB,          -- [{text, type, severity}]

  -- Sales (Pitching only)
  salesScore              INT,
  presentationStructure   INT,
  engagementScore         INT,
  questionQualityScore    INT,
  speechPaceScore         INT,

  -- AI Outputs
  summary           TEXT,
  keyInsights       JSONB,        -- string[]
  actionItems       JSONB,        -- string[]
  improvements      JSONB,        -- string[]
  sentimentOverall  TEXT,         -- positive | neutral | negative

  createdAt   TIMESTAMP DEFAULT NOW(),
  updatedAt   TIMESTAMP
)
```

---

## Scoring Reasoning

### Meeting Quality Score
5 equally-weighted dimensions. AI evaluates each 0–100:

| Metric | What it measures | High score = |
|--------|-----------------|--------------|
| Action Items | Are clear next steps defined? | Specific tasks with owners/dates |
| Decision Made | Were decisions actually reached? | Concrete decisions, not just discussion |
| Speaking Balance | Does one person dominate? | ~equal talk time |
| Topic Focus | Does discussion stay on agenda? | Minimal tangents |
| Duration Efficiency | Was time used well? | Covered topics without waste |

**Final Meeting Score** = average of 5 metrics

### Risk Level Classification

Claude identifies risk signals using:
1. **Keyword matching** — direct Thai/English cancel phrases
2. **Semantic analysis** — implied dissatisfaction, even without exact keywords  
3. **Tone analysis** — frustrated or defeated tone detected

| Level | Threshold |
|-------|-----------|
| Low | 0 risk signals, or only 1 low-severity |
| Medium | 1-2 signals, severity ≤ medium |
| High | Any high-severity signal, or 3+ signals |

### Sales Score (Pitching only)
```
Sales Score = avg(
  presentationStructure,   -- Clear intro → problem → solution → pricing → CTA
  engagement,              -- Client asks questions, shows interest
  questionQuality,         -- Staff handles objections well
  speechPace               -- Not too fast, not too slow, confident
)
```

---

## Scaling Plan (10+ meetings/day)

### Current (MVP)
- Synchronous AI calls (avg 3-5 sec per meeting)
- Works well for <20 meetings/day

### Scale Phase 1 (20-100/day)
```
1. Add Redis + BullMQ queue
   - POST /api/analyze → enqueue job → return jobId
   - Worker processes in background
   - Frontend polls GET /api/jobs/[jobId]

2. Add DB indexes:
   CREATE INDEX idx_meetings_date ON meetings(meetingDate DESC);
   CREATE INDEX idx_meetings_risk ON meetings(riskLevel);
   CREATE INDEX idx_meetings_type ON meetings(meetingType);

3. Cache dashboard stats with Redis (TTL: 5 min)
```

### Scale Phase 2 (100+/day)
```
1. Horizontal scaling — multiple Next.js instances (Vercel auto-scales)
2. Connection pooling — PgBouncer or Prisma Accelerate
3. Read replica — separate read-heavy dashboard queries
4. Webhook alerts — Slack/LINE bot when riskLevel = 'high'
5. Batch processing — weekly/monthly report generation
```

---

## Future Improvements

1. **Speech-to-Text** — Integrate Whisper API to accept audio/video files
2. **Real-time analysis** — Stream AI response for faster perceived speed  
3. **Slack/LINE alerts** — Instant notification on high-risk detection
4. **CRM integration** — Link meetings to hotel/client records
5. **Trend analysis** — Track risk trajectory per client over time
6. **Multi-language** — Better support for mixed Thai-English transcripts
7. **Custom scoring weights** — Let managers adjust metric importance
8. **Email reports** — Auto-send weekly digest to management
