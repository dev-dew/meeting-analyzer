'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, Download, ChevronLeft, ChevronRight, Filter, X, ExternalLink, PlusCircle } from 'lucide-react'
import { RiskBadge, MeetingTypeBadge, SentimentBadge } from '@/components/ui/Badges'
import { formatDate } from '@/lib/utils'

interface Meeting {
  id: string; title: string; meetingType: string; meetingDate: string
  meetingScore: number | null; salesScore: number | null
  riskLevel: string | null; sentimentOverall: string | null
  summary: string | null; participants: any[]; videoUrl: string | null
  createdAt: string; user?: { name: string; email: string }
}

const TYPES = [
  { value: '', label: 'ทุกประเภท' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'pitching', label: 'Pitching' },
  { value: 'first_meeting', label: 'First Meeting' },
]
const RISKS = [
  { value: '', label: 'ทุก Risk' },
  { value: 'high', label: '🔴 High' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'low', label: '🟢 Low' },
]

export default function RecordsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [risk, setRisk] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [showFilter, setShowFilter] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page), search, type, risk, from, to,
    })
    const res = await fetch(`/api/records?${params}`)
    const data = await res.json()
    setMeetings(data.meetings || [])
    setTotal(data.total || 0)
    setPages(data.pages || 1)
    setLoading(false)
  }, [page, search, type, risk, from, to])

  useEffect(() => { fetchData() }, [fetchData])

  // Reset page on filter change
  useEffect(() => { setPage(1) }, [search, type, risk, from, to])

  async function handleExport() {
    setExporting(true)
    try {
      const params = new URLSearchParams({ search, type, risk, from, to })
      const res = await fetch(`/api/records/export?${params}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `meeting-records-${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  function clearFilters() {
    setSearch(''); setType(''); setRisk(''); setFrom(''); setTo('')
  }

  const hasFilter = search || type || risk || from || to
  const inputStyle = { background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#E8E8E8' }

  return (
    <div className="p-8 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Meeting Records</h1>
          <p className="text-sm mt-1" style={{ color: '#666' }}>
            ทั้งหมด {total} รายการ
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:bg-white/5 disabled:opacity-50"
            style={{ borderColor: '#333', color: '#E8E8E8' }}>
            <Download size={14} />
            {exporting ? 'Exporting...' : 'Export Excel'}
          </button>
          <Link href="/analyze"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: '#F5C800', color: '#000' }}>
            <PlusCircle size={14} /> New Analysis
          </Link>
        </div>
      </div>

      {/* Search + Filter bar */}
      <div className="rounded-2xl p-4 border mb-4 space-y-3" style={{ background: '#141414', borderColor: '#222' }}>
        <div className="flex gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#555' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อการประชุม หรือสรุป..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm placeholder-[#444] outline-none focus:ring-1 focus:ring-[#F5C800]"
              style={inputStyle} />
          </div>
          {/* Filter toggle */}
          <button onClick={() => setShowFilter(s => !s)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border transition-all"
            style={showFilter
              ? { background: 'rgba(245,200,0,0.1)', borderColor: '#F5C800', color: '#F5C800' }
              : { ...inputStyle, borderColor: '#2A2A2A' }}>
            <Filter size={13} /> Filter
            {hasFilter && <span className="w-2 h-2 rounded-full" style={{ background: '#F5C800' }} />}
          </button>
          {hasFilter && (
            <button onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm transition-all hover:bg-white/5"
              style={{ color: '#666' }}>
              <X size={13} /> ล้าง
            </button>
          )}
        </div>

        {/* Expanded filters */}
        {showFilter && (
          <div className="grid grid-cols-4 gap-3 pt-2 border-t" style={{ borderColor: '#222' }}>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#666' }}>ประเภท</label>
              <select value={type} onChange={e => setType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none focus:ring-1 focus:ring-[#F5C800]"
                style={inputStyle}>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#666' }}>Risk Level</label>
              <select value={risk} onChange={e => setRisk(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none focus:ring-1 focus:ring-[#F5C800]"
                style={inputStyle}>
                {RISKS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#666' }}>วันที่เริ่ม</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none focus:ring-1 focus:ring-[#F5C800]"
                style={{ ...inputStyle, colorScheme: 'dark' }} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: '#666' }}>วันที่สิ้นสุด</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none focus:ring-1 focus:ring-[#F5C800]"
                style={{ ...inputStyle, colorScheme: 'dark' }} />
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden mb-4" style={{ background: '#141414', borderColor: '#222' }}>
        {/* Table header */}
        <div className="grid text-xs font-medium px-4 py-3 border-b"
          style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 80px', borderColor: '#1E1E1E', color: '#555' }}>
          <span>ชื่อการประชุม</span>
          <span>ประเภท</span>
          <span>วันที่</span>
          <span className="text-center">คะแนน</span>
          <span>Risk</span>
          <span>Sentiment</span>
          <span className="text-center">Actions</span>
        </div>

        {loading ? (
          <div className="py-16 text-center" style={{ color: '#555' }}>
            <div className="animate-spin w-6 h-6 border-2 border-[#F5C800] border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm">กำลังโหลด...</p>
          </div>
        ) : meetings.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm" style={{ color: '#555' }}>ไม่พบรายการที่ค้นหา</p>
            {hasFilter && (
              <button onClick={clearFilters} className="text-xs mt-2" style={{ color: '#F5C800' }}>
                ล้าง filter
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#1A1A1A' }}>
            {meetings.map((m, i) => {
              const score = m.salesScore ?? m.meetingScore
              const sc = !score ? '#666' : score >= 80 ? '#22C55E' : score >= 60 ? '#F59E0B' : '#EF4444'
              const rowBg = i % 2 === 1 ? 'rgba(255,255,255,0.01)' : 'transparent'

              return (
                <div key={m.id}
                  className="grid items-center px-4 py-3 hover:bg-white/[0.02] transition-colors text-sm"
                  style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 80px', background: rowBg }}>
                  {/* Title */}
                  <div className="min-w-0 pr-3">
                    <Link href={`/meetings/${m.id}`}
                      className="font-medium text-white hover:text-[#F5C800] transition-colors truncate block">
                      {m.title}
                    </Link>
                    {m.user?.name && (
                      <span className="text-xs" style={{ color: '#555' }}>โดย {m.user.name}</span>
                    )}
                  </div>
                  {/* Type */}
                  <div><MeetingTypeBadge type={m.meetingType} /></div>
                  {/* Date */}
                  <div className="text-xs" style={{ color: '#777' }}>
                    {new Date(m.meetingDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                  {/* Score */}
                  <div className="text-center">
                    <span className="font-bold text-base" style={{ color: sc }}>
                      {score ?? '—'}
                    </span>
                  </div>
                  {/* Risk */}
                  <div>{m.riskLevel ? <RiskBadge level={m.riskLevel} /> : <span style={{ color: '#444' }}>—</span>}</div>
                  {/* Sentiment */}
                  <div><SentimentBadge sentiment={m.sentimentOverall} /></div>
                  {/* Actions */}
                  <div className="flex items-center justify-center gap-2">
                    <Link href={`/meetings/${m.id}`}
                      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                      style={{ color: '#666' }}>
                      <ExternalLink size={13} />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: '#555' }}>
            หน้า {page} จาก {pages} ({total} รายการ)
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm border transition-all hover:bg-white/5 disabled:opacity-30"
              style={{ borderColor: '#333', color: '#E8E8E8' }}>
              <ChevronLeft size={14} /> ก่อนหน้า
            </button>

            {/* Page numbers */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                let p: number
                if (pages <= 5) p = i + 1
                else if (page <= 3) p = i + 1
                else if (page >= pages - 2) p = pages - 4 + i
                else p = page - 2 + i
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className="w-9 h-9 rounded-lg text-sm font-medium transition-all"
                    style={page === p
                      ? { background: '#F5C800', color: '#000' }
                      : { background: '#1A1A1A', color: '#888', border: '1px solid #2A2A2A' }}>
                    {p}
                  </button>
                )
              })}
            </div>

            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm border transition-all hover:bg-white/5 disabled:opacity-30"
              style={{ borderColor: '#333', color: '#E8E8E8' }}>
              ถัดไป <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
