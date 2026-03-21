'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PlusCircle, Trash2, Loader2, FileText, Upload, CheckCircle, Mic, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Role = 'staff' | 'client'
type MeetingType = 'monthly' | 'pitching' | 'first_meeting'
type InputMethod = 'paste' | 'upload'
interface Participant { name: string; role: Role }

const MEETING_TYPES: { value: MeetingType; label: string; desc: string }[] = [
  { value: 'monthly',       label: 'Monthly Meeting',  desc: 'Regular monthly review with existing client' },
  { value: 'pitching',      label: 'Pitching Meeting',  desc: 'First-time sales presentation' },
  { value: 'first_meeting', label: 'First Meeting',     desc: 'Initial pricing/plan introduction' },
]

const INPUT_METHODS = [
  { value: 'upload', icon: Upload,   label: 'Upload File',       desc: 'MP4, MP3, M4A, WAV, WebM (ไม่เกิน 1GB)' },
  { value: 'paste',  icon: FileText, label: 'Paste Transcript', desc: 'วาง text โดยตรง หรือ copy จาก Meet/Zoom' },
]

const ACCEPTED_TYPES = '.mp4,.mp3,.m4a,.wav,.webm,.ogg,.flac,.mov,.avi,.mkv'

export default function AnalyzePage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [error, setError] = useState('')
  const [transcribeError, setTranscribeError] = useState('')

  const [form, setForm] = useState({
    title: '',
    meetingType: 'monthly' as MeetingType,
    meetingDate: new Date().toISOString().slice(0, 16),
    inputMethod: 'upload' as InputMethod,
    transcript: '',
    driveUrl: '',
    videoUrl: '',
  })
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([
    { name: '', role: 'staff' },
    { name: '', role: 'client' },
  ])

  function addParticipant() { setParticipants(p => [...p, { name: '', role: 'client' }]) }
  function removeParticipant(i: number) { setParticipants(p => p.filter((_, idx) => idx !== i)) }
  function updateParticipant(i: number, field: keyof Participant, value: string) {
    setParticipants(p => p.map((pp, idx) => idx === i ? { ...pp, [field]: value } : pp))
  }

  // ─── Transcribe from Drive URL (AssemblyAI) ──────────────────
  async function handleTranscribeDrive() {
    if (!form.driveUrl.trim()) return setTranscribeError('กรุณาใส่ Google Drive URL')
    setTranscribing(true)
    setTranscribeError('')
    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driveUrl: form.driveUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setForm(f => ({ ...f, transcript: data.transcript, videoUrl: form.driveUrl }))
    } catch (e: any) {
      setTranscribeError(e.message)
    } finally {
      setTranscribing(false)
    }
  }

  // ─── Transcribe from uploaded file (Groq) ────────────────────
  async function handleTranscribeFile() {
    if (!uploadedFile) return setTranscribeError('กรุณาเลือกไฟล์ก่อน')
    setTranscribing(true)
    setTranscribeError('')
    try {
      const fd = new FormData()
      fd.append('file', uploadedFile)
      const res = await fetch('/api/transcribe', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setForm(f => ({ ...f, transcript: data.transcript }))
    } catch (e: any) {
      setTranscribeError(e.message)
    } finally {
      setTranscribing(false)
    }
  }

  // ─── Submit final analysis ────────────────────────────────────
  async function handleSubmit() {
    setError('')
    if (!form.title.trim()) return setError('กรุณาใส่ชื่อการประชุม')
    if (!form.transcript.trim()) return setError('กรุณาใส่ transcript ของการประชุม')
    const validParticipants = participants.filter(p => p.name.trim())
    if (validParticipants.length < 1) return setError('เพิ่มผู้เข้าร่วมประชุมอย่างน้อย 1 คน')

    setLoading(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          meetingType: form.meetingType,
          meetingDate: form.meetingDate,
          transcript: form.transcript,
          inputMethod: form.inputMethod,
          videoUrl: form.videoUrl || form.driveUrl || undefined,
          participants: validParticipants,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      router.push(`/meetings/${data.meeting.id}`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = { background: '#1A1A1A', border: '1px solid #2A2A2A' }
  const hasTranscript = form.transcript.trim().length > 20
  const hasDriveTranscript = hasTranscript && form.videoUrl === form.driveUrl && form.driveUrl.length > 0

  return (
    <div className="p-8 max-w-3xl animate-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">New Meeting Analysis</h1>
        <p className="text-sm mt-1" style={{ color: '#666' }}>
          รับข้อมูลได้ 2 วิธี: Upload ไฟล์ · Paste text จากการประชุม 
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {['Meeting Info', 'Participants', 'Transcript'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button onClick={() => setStep(i + 1)}
              className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                step === i + 1 ? 'text-black' : step > i + 1 ? 'text-green-400' : 'text-[#555]')}
              style={step === i + 1 ? { background: '#F5C800' } : step > i + 1 ? { background: 'rgba(34,197,94,0.15)' } : {}}>
              {step > i + 1 ? <CheckCircle size={12} /> : <span>{i + 1}</span>}
              {s}
            </button>
            {i < 2 && <div className="w-6 h-px" style={{ background: '#333' }} />}
          </div>
        ))}
      </div>

      {/* ─── STEP 1: Meeting Info ─────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6 animate-in">
          <div className="rounded-2xl p-6 border space-y-5" style={{ background: '#141414', borderColor: '#222' }}>
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#F5C800' }}>Meeting Information</h2>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Meeting Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Monthly Sync Up – One Sakhon Nakon Hotel"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#444] outline-none focus:ring-1 focus:ring-[#F5C800]"
                style={inputStyle} />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-3">Meeting Type *</label>
              <div className="grid grid-cols-3 gap-3">
                {MEETING_TYPES.map(t => (
                  <button key={t.value} onClick={() => setForm(f => ({ ...f, meetingType: t.value }))}
                    className="p-3 rounded-xl border text-left transition-all"
                    style={form.meetingType === t.value
                      ? { background: 'rgba(245,200,0,0.08)', borderColor: '#F5C800' }
                      : { background: '#1A1A1A', borderColor: '#2A2A2A' }}>
                    <div className="text-sm font-semibold mb-1"
                      style={{ color: form.meetingType === t.value ? '#F5C800' : '#E8E8E8' }}>{t.label}</div>
                    <div className="text-xs leading-relaxed" style={{ color: '#666' }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Meeting Date &amp; Time *</label>
              <div className="flex gap-2">
              <input type="datetime-local" value={form.meetingDate}
                onChange={e => setForm(f => ({ ...f, meetingDate: e.target.value }))}
                className="flex-1 px-4 py-3 rounded-xl text-sm text-white outline-none focus:ring-1 focus:ring-[#F5C800]"
                style={{ ...inputStyle, colorScheme: 'dark' }} />
              </div>
            </div>

            {/* ── Recording Video URL ── */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Recording Video URL
                <span className="ml-2 text-xs font-normal" style={{ color: '#555' }}>(ถ้ามี)</span>
              </label>
              <div className="flex gap-2">
                <input value={form.driveUrl}
                  onChange={e => { setForm(f => ({ ...f, driveUrl: e.target.value })); setTranscribeError('') }}
                  placeholder="https://drive.google.com/file/d/xxxx/view หรือ https://zoom.us/rec/share/xxxx"
                  className="flex-1 px-4 py-3 rounded-xl text-sm text-white placeholder-[#444] outline-none focus:ring-1 focus:ring-[#F5C800]"
                  style={inputStyle} />
              </div>

              {/* Drive transcript result */}
              {hasDriveTranscript && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium" style={{ color: '#22C55E' }}>
                      ✅ Transcript พร้อมแล้ว ({form.transcript.length} chars)
                    </p>
                    <button onClick={() => setForm(f => ({ ...f, transcript: '', videoUrl: '' }))}
                      className="text-xs flex items-center gap-1" style={{ color: '#555' }}>
                      <X size={11} /> ล้าง
                    </button>
                  </div>
                  <textarea value={form.transcript} onChange={e => setForm(f => ({ ...f, transcript: e.target.value }))}
                    rows={5} className="w-full px-4 py-3 rounded-xl text-xs text-white outline-none focus:ring-1 focus:ring-[#F5C800] resize-none font-mono leading-relaxed"
                    style={inputStyle} />
                </div>
              )}

              {/* Error */}
              {transcribeError && (
                <div className="mt-2 flex items-start gap-2 px-3 py-2.5 rounded-xl border"
                  style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)', color: '#EF4444' }}>
                  <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                  <p className="text-xs">{transcribeError}</p>
                </div>
              )}

            </div>
          </div>

          <button onClick={() => setStep(2)} className="w-full py-3 rounded-xl font-semibold text-sm hover:opacity-90" style={{ background: '#F5C800', color: '#000' }}>
            Next: Add Participants →
          </button>
        </div>
      )}

      {/* ─── STEP 2: Participants ─────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-6 animate-in">
          <div className="rounded-2xl p-6 border space-y-4" style={{ background: '#141414', borderColor: '#222' }}>
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#F5C800' }}>Participants</h2>
            {participants.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <input value={p.name} onChange={e => updateParticipant(i, 'name', e.target.value)}
                  placeholder={`ชื่อผู้เข้าร่วม ${i + 1}`}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white placeholder-[#444] outline-none focus:ring-1 focus:ring-[#F5C800]"
                  style={inputStyle} />
                <select value={p.role} onChange={e => updateParticipant(i, 'role', e.target.value as Role)}
                  className="px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ ...inputStyle, color: p.role === 'staff' ? '#60A5FA' : '#F5C800' }}>
                  <option value="staff">Staff (ทีม)</option>
                  <option value="client">Client (ลูกค้า)</option>
                </select>
                {participants.length > 2 && (
                  <button onClick={() => removeParticipant(i)} className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-red-500/20" style={{ color: '#EF4444' }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            <button onClick={addParticipant} className="flex items-center gap-2 text-sm hover:opacity-80" style={{ color: '#F5C800' }}>
              <PlusCircle size={14} /> เพิ่มผู้เข้าร่วม
            </button>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl font-semibold text-sm border hover:bg-white/5" style={{ borderColor: '#333', color: '#E8E8E8' }}>← Back</button>
            <button onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl font-semibold text-sm hover:opacity-90" style={{ background: '#F5C800', color: '#000' }}>Next: Transcript →</button>
          </div>
        </div>
      )}

      {/* ─── STEP 3: Transcript ───────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-5 animate-in">
          <div className="rounded-2xl p-6 border space-y-5" style={{ background: '#141414', borderColor: '#222' }}>
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#F5C800' }}>Transcript</h2>

            {/* If Drive transcript already exists from step 1 */}
            {hasDriveTranscript ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium" style={{ color: '#22C55E' }}>
                    ✅ ได้ Transcript จาก Google Drive แล้ว
                  </p>
                  <button onClick={() => setForm(f => ({ ...f, transcript: '', videoUrl: '' }))}
                    className="text-xs flex items-center gap-1" style={{ color: '#555' }}>
                    <X size={11} /> ล้าง
                  </button>
                </div>
                <textarea value={form.transcript} onChange={e => setForm(f => ({ ...f, transcript: e.target.value }))}
                  rows={12} className="w-full px-4 py-3 rounded-xl text-xs text-white outline-none focus:ring-1 focus:ring-[#F5C800] resize-none font-mono leading-relaxed"
                  style={inputStyle} />
                <p className="text-xs" style={{ color: '#555' }}>แก้ไข transcript ได้ถ้าต้องการ หรือกด Analyze ได้เลย</p>
              </div>
            ) : (
              <>
                {/* Input method: Paste or Upload only */}
                <div className="grid grid-cols-2 gap-3">
                  {INPUT_METHODS.map(({ value, icon: Icon, label, desc }) => (
                    <button key={value} onClick={() => { setForm(f => ({ ...f, inputMethod: value as InputMethod })); setTranscribeError('') }}
                      className="p-3 rounded-xl border text-left transition-all"
                      style={form.inputMethod === value
                        ? { background: 'rgba(245,200,0,0.08)', borderColor: '#F5C800' }
                        : { background: '#1A1A1A', borderColor: '#2A2A2A' }}>
                      <Icon size={14} className="mb-2" style={{ color: form.inputMethod === value ? '#F5C800' : '#555' }} />
                      <div className="text-xs font-semibold mb-0.5" style={{ color: form.inputMethod === value ? '#F5C800' : '#E8E8E8' }}>{label}</div>
                      <div className="text-xs leading-relaxed" style={{ color: '#555' }}>{desc}</div>
                    </button>
                  ))}
                </div>

                {/* ── Paste ── */}
                {form.inputMethod === 'paste' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-white">Transcript / Summary *</label>
                      <span className="text-xs" style={{ color: '#555' }}>{form.transcript.length} chars</span>
                    </div>
                    <textarea value={form.transcript} onChange={e => setForm(f => ({ ...f, transcript: e.target.value }))}
                      rows={12}
                      placeholder={'วาง transcript หรือสรุปการประชุมที่นี่...\n\nรูปแบบที่แนะนำ:\nคุณแบงค์: สวัสดีครับ วันนี้เราจะมาสรุปผล...\nคุณนิพัทธ์: ยอดจองช่วงนี้ตกลงนะครับ...\n\nหรือ export transcript จาก Google Meet:\nSettings → Transcripts → Download'}
                      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#444] outline-none focus:ring-1 focus:ring-[#F5C800] resize-none font-mono leading-relaxed"
                      style={inputStyle} />
                  </div>
                )}

                {/* ── Upload ── */}
                {form.inputMethod === 'upload' && (
                  <div className="space-y-3">
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:border-[#F5C800] hover:bg-yellow-500/5"
                      style={{ borderColor: uploadedFile ? '#22C55E' : '#333' }}>
                      <input ref={fileRef} type="file" accept={ACCEPTED_TYPES} className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) { setUploadedFile(f); setTranscribeError('') } }} />
                      {uploadedFile ? (
                        <div>
                          <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(34,197,94,0.15)' }}>
                            <CheckCircle size={20} style={{ color: '#22C55E' }} />
                          </div>
                          <p className="text-sm font-medium text-white">{uploadedFile.name}</p>
                          <p className="text-xs mt-1" style={{ color: '#555' }}>{(uploadedFile.size / 1024 / 1024).toFixed(1)} MB</p>
                        </div>
                      ) : (
                        <div>
                          <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: '#1A1A1A' }}>
                            <Upload size={20} style={{ color: '#555' }} />
                          </div>
                          <p className="text-sm text-white">คลิกเพื่อเลือกไฟล์</p>
                          <p className="text-xs mt-1" style={{ color: '#555' }}>MP4, WebM, MP3, M4A, WAV, MOV · ไม่เกิน 1GB</p>
                        </div>
                      )}
                    </div>

                    {uploadedFile && !hasTranscript && (
                      <button onClick={handleTranscribeFile} disabled={transcribing}
                        className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
                        style={{ background: 'rgba(245,200,0,0.1)', border: '1px solid rgba(245,200,0,0.3)', color: '#F5C800' }}>
                        {transcribing
                          ? <><Loader2 size={14} className="animate-spin" /> กำลังแปลงเสียง...</>
                          : <><Mic size={14} /> แปลงเสียงเป็น Transcript (Groq)</>}
                      </button>
                    )}

                    {hasTranscript && form.inputMethod === 'upload' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium" style={{ color: '#22C55E' }}>✅ Transcript พร้อมแล้ว ({form.transcript.length} chars)</p>
                          <button onClick={() => { setForm(f => ({ ...f, transcript: '' })); setUploadedFile(null) }} className="text-xs flex items-center gap-1" style={{ color: '#555' }}>
                            <X size={11} /> ล้าง
                          </button>
                        </div>
                        <textarea value={form.transcript} onChange={e => setForm(f => ({ ...f, transcript: e.target.value }))}
                          rows={6} className="w-full px-4 py-3 rounded-xl text-xs text-white outline-none focus:ring-1 focus:ring-[#F5C800] resize-none font-mono leading-relaxed"
                          style={inputStyle} />
                      </div>
                    )}

                    <div className="p-3 rounded-xl border" style={{ background: 'rgba(245,200,0,0.04)', borderColor: 'rgba(245,200,0,0.12)' }}>
                      <p className="text-xs" style={{ color: '#555' }}>
                        ระบบใช้ <strong style={{ color: '#E8E8E8' }}> Groq AI (Whisper Large v3) </strong> ในการถอดเสียงอัตโนมัติ รองรับภาษาไทย + อังกฤษ {' '}
                        
                      </p>
                    </div>
                  </div>
                )}

                {/* Error */}
                {transcribeError && (
                  <div className="flex items-start gap-2 px-4 py-3 rounded-xl border" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)', color: '#EF4444' }}>
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    <p className="text-xs">{transcribeError}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm border" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#EF4444' }}>
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl font-semibold text-sm border hover:bg-white/5" style={{ borderColor: '#333', color: '#E8E8E8' }}>← Back</button>
            <button onClick={handleSubmit} disabled={loading || !hasTranscript}
              className="flex-1 py-3 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2 transition-all"
              style={{ background: '#F5C800', color: '#000' }}>
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> กำลังวิเคราะห์...</>
                : !hasTranscript
                  ? 'รอ Transcript ก่อน...'
                  : <>วิเคราะห์การประชุม ✨</>}
            </button>
          </div>

          {!hasTranscript && (
            <p className="text-center text-xs" style={{ color: '#444' }}>
              ปุ่ม Analyze จะ active หลังจากได้ transcript แล้วครับ
            </p>
          )}
        </div>
      )}
    </div>
  )
}
