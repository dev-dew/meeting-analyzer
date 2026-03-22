'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  User, Lock, Bell, Key, Server, Mail, CheckCircle2,
  AlertTriangle, Loader2, Eye, EyeOff, ExternalLink,
  Copy, Check, Send, RefreshCw
} from 'lucide-react'

interface Config {
  groqApiKey: string; assemblyAiKey: string; resendApiKey: string
  emailFrom: string; adminEmail: string; appUrl: string
  hasGroq: boolean; hasAssemblyAi: boolean; hasResend: boolean
}
interface UserData { id: string; name: string; email: string; role: string; createdAt: string }
interface Stats { meetingCount: number; totalMeetings: number; userCount: number }

const TABS = [
  { id: 'profile',       icon: User,   label: 'โปรไฟล์' },
  { id: 'password',      icon: Lock,   label: 'รหัสผ่าน' },
  { id: 'notifications', icon: Bell,   label: 'การแจ้งเตือน' },
  // { id: 'api',           icon: Key,    label: 'API Keys' },
  { id: 'system',        icon: Server, label: 'System' },
]

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full"
      style={ok
        ? { background: 'rgba(34,197,94,0.12)', color: '#22C55E' }
        : { background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: ok ? '#22C55E' : '#EF4444' }} />
      {ok ? 'Connected' : 'Not set'}
    </span>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button onClick={copy} className="p-1.5 rounded transition-colors hover:bg-white/10" style={{ color: '#666' }}>
      {copied ? <Check size={12} style={{ color: '#22C55E' }} /> : <Copy size={12} />}
    </button>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const [tab, setTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [user, setUser] = useState<UserData | null>(null)
  const [config, setConfig] = useState<Config | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)

  // Profile form
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  // Password form
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  // Notification form
  const [notifyOnAnalysis, setNotifyOnAnalysis] = useState(true)
  const [notifyHighRisk, setNotifyHighRisk] = useState(true)
  const [weeklyDigest, setWeeklyDigest] = useState(true)
  const [sendingDigest, setSendingDigest] = useState(false)

  useEffect(() => { fetchSettings() }, [])

  async function fetchSettings() {
    setLoading(true)
    const res = await fetch('/api/settings')
    const data = await res.json()
    if (data.user) {
      setUser(data.user)
      setName(data.user.name)
      setEmail(data.user.email)
    }
    if (data.config) setConfig(data.config)
    if (data.stats) setStats(data.stats)
    setLoading(false)
  }

  function showSuccess(msg: string) {
    setSuccess(msg); setError('')
    setTimeout(() => setSuccess(''), 3000)
  }

  async function saveProfile() {
    setSaving(true); setError(''); setSuccess('')
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'profile', name, email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setUser(data.user)
      showSuccess('บันทึกโปรไฟล์สำเร็จ')
    } catch (e: any) { setError(e.message) } finally { setSaving(false) }
  }

  async function savePassword() {
    if (newPw !== confirmPw) return setError('รหัสผ่านใหม่ไม่ตรงกัน')
    setSaving(true); setError(''); setSuccess('')
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'password', currentPassword: currentPw, newPassword: newPw }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      showSuccess('เปลี่ยนรหัสผ่านสำเร็จ')
    } catch (e: any) { setError(e.message) } finally { setSaving(false) }
  }

  async function sendWeeklyNow() {
    setSendingDigest(true)
    try {
      const res = await fetch('/api/email/weekly')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      showSuccess(`ส่ง Weekly Digest แล้ว (${data.sent} meetings)`)
    } catch (e: any) { setError(e.message) } finally { setSendingDigest(false) }
  }

  const inputCls = "w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#444] outline-none focus:ring-1 focus:ring-[#F5C800]"
  const inputStyle = { background: '#1A1A1A', border: '1px solid #2A2A2A' }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#F5C800] border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm" style={{ color: '#555' }}>กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 animate-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm mt-1" style={{ color: '#666' }}>ตั้งค่าโปรไฟล์ การแจ้งเตือน และการเชื่อมต่อ</p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar tabs */}
        <div className="w-52 flex-shrink-0 space-y-1">
          {TABS.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => { setTab(id); setError(''); setSuccess('') }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
              style={tab === id
                ? { background: '#F5C800', color: '#000' }
                : { color: '#888' }}>
              <Icon size={15} />
              {label}
            </button>
          ))}

          {/* User card */}
          {user && (
            <div className="mt-6 p-4 rounded-xl border" style={{ background: '#141414', borderColor: '#222' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-2"
                style={{ background: 'rgba(245,200,0,0.15)', color: '#F5C800' }}>
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <p className="text-xs font-medium text-white text-center truncate">{user.name}</p>
              <p className="text-xs text-center truncate mt-0.5" style={{ color: '#555' }}>{user.email}</p>
              <div className="mt-2 text-center">
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={user.role === 'admin'
                    ? { background: 'rgba(167,139,250,0.15)', color: '#A78BFA' }
                    : { background: 'rgba(96,165,250,0.15)', color: '#60A5FA' }}>
                  {user.role === 'admin' ? 'Admin' : 'Member'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Success / Error */}
          {success && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl border mb-4"
              style={{ background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.25)', color: '#22C55E' }}>
              <CheckCircle2 size={14} /> {success}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl border mb-4"
              style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)', color: '#EF4444' }}>
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          {/* ── PROFILE ────────────────────────────────────────── */}
          {tab === 'profile' && (
            <div className="space-y-6 animate-in">
              <div className="rounded-2xl p-6 border space-y-5" style={{ background: '#141414', borderColor: '#222' }}>
                <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#F5C800' }}>ข้อมูลส่วนตัว</h2>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">ชื่อ-นามสกุล</label>
                  <input value={name} onChange={e => setName(e.target.value)}
                    placeholder="ชื่อของคุณ" className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">อีเมล</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="email@example.com" className={inputCls} style={inputStyle} />
                  <p className="text-xs mt-1.5" style={{ color: '#555' }}>ใช้สำหรับ login และรับ email report</p>
                </div>

                <button onClick={saveProfile} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                  style={{ background: '#F5C800', color: '#000' }}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  บันทึกโปรไฟล์
                </button>
              </div>

              {/* Stats */}
              {stats && (
                <div className="rounded-2xl p-6 border" style={{ background: '#141414', borderColor: '#222' }}>
                  <h2 className="text-sm font-semibold uppercase tracking-wider mb-5" style={{ color: '#F5C800' }}>สถิติของคุณ</h2>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Meeting ของคุณ', value: stats.meetingCount },
                      { label: 'Meeting ทั้งระบบ', value: stats.totalMeetings },
                      { label: 'ผู้ใช้ทั้งหมด', value: stats.userCount },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-xl p-4 text-center" style={{ background: '#1A1A1A' }}>
                        <div className="text-2xl font-bold" style={{ color: '#F5C800' }}>{value}</div>
                        <div className="text-xs mt-1" style={{ color: '#555' }}>{label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t text-xs" style={{ borderColor: '#222', color: '#555' }}>
                    สมัครเมื่อ: {user ? new Date(user.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── PASSWORD ────────────────────────────────────────── */}
          {tab === 'password' && (
            <div className="rounded-2xl p-6 border space-y-5 animate-in" style={{ background: '#141414', borderColor: '#222' }}>
              <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#F5C800' }}>เปลี่ยนรหัสผ่าน</h2>

              {[
                { label: 'รหัสผ่านปัจจุบัน', val: currentPw, set: setCurrentPw, show: showCurrent, setShow: setShowCurrent },
                { label: 'รหัสผ่านใหม่', val: newPw, set: setNewPw, show: showNew, setShow: setShowNew },
                { label: 'ยืนยันรหัสผ่านใหม่', val: confirmPw, set: setConfirmPw, show: showNew, setShow: setShowNew },
              ].map(({ label, val, set, show, setShow }) => (
                <div key={label}>
                  <label className="block text-sm font-medium text-white mb-2">{label}</label>
                  <div className="relative">
                    <input type={show ? 'text' : 'password'} value={val} onChange={e => set(e.target.value)}
                      placeholder="••••••••" className={`${inputCls} pr-11`} style={inputStyle} />
                    <button type="button" onClick={() => setShow((s: boolean) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#555' }}>
                      {show ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              ))}

              <div className="p-4 rounded-xl" style={{ background: '#1A1A1A' }}>
                <p className="text-xs font-medium mb-2" style={{ color: '#888' }}>ข้อกำหนดรหัสผ่าน:</p>
                {[
                  { ok: newPw.length >= 6, label: 'อย่างน้อย 6 ตัวอักษร' },
                  { ok: newPw === confirmPw && newPw.length > 0, label: 'รหัสผ่านตรงกัน' },
                  { ok: newPw !== currentPw && newPw.length > 0, label: 'ไม่ซ้ำกับรหัสผ่านเดิม' },
                ].map(({ ok, label }) => (
                  <div key={label} className="flex items-center gap-2 text-xs mt-1">
                    <span style={{ color: ok ? '#22C55E' : '#555' }}>{ok ? '✓' : '○'}</span>
                    <span style={{ color: ok ? '#22C55E' : '#666' }}>{label}</span>
                  </div>
                ))}
              </div>

              <button onClick={savePassword} disabled={saving || !currentPw || !newPw || newPw !== confirmPw}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40"
                style={{ background: '#F5C800', color: '#000' }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                เปลี่ยนรหัสผ่าน
              </button>
            </div>
          )}

          {/* ── NOTIFICATIONS ────────────────────────────────────── */}
          {tab === 'notifications' && (
            <div className="space-y-5 animate-in">
              <div className="rounded-2xl p-6 border space-y-5" style={{ background: '#141414', borderColor: '#222' }}>
                <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#F5C800' }}>การแจ้งเตือนทาง Email</h2>

                {[
                  {
                    id: 'analysis', val: notifyOnAnalysis, set: setNotifyOnAnalysis,
                    label: 'ส่ง report หลังวิเคราะห์เสร็จ',
                    desc: 'รับ email report ทุกครั้งที่วิเคราะห์ meeting เสร็จ',
                  },
                  {
                    id: 'risk', val: notifyHighRisk, set: setNotifyHighRisk,
                    label: 'แจ้งเตือน High Risk',
                    desc: 'รับ email ทันทีเมื่อตรวจพบสัญญาณเสี่ยงสูง',
                  },
                  {
                    id: 'weekly', val: weeklyDigest, set: setWeeklyDigest,
                    label: 'Weekly Digest',
                    desc: 'สรุปการประชุมประจำสัปดาห์ทุกวันจันทร์เช้า',
                  },
                ].map(({ id, val, set, label, desc }) => (
                  <div key={id} className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-white">{label}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#555' }}>{desc}</p>
                    </div>
                    <button onClick={() => set((v: boolean) => !v)}
                      className="relative w-11 h-6 rounded-full flex-shrink-0 transition-colors"
                      style={{ background: val ? '#F5C800' : '#2A2A2A' }}>
                      <span className="absolute top-1 w-4 h-4 rounded-full transition-transform"
                        style={{ background: '#fff', left: val ? '24px' : '4px' }} />
                    </button>
                  </div>
                ))}

                {config && !config.hasResend && (
                  <div className="p-4 rounded-xl border" style={{ background: 'rgba(245,158,11,0.07)', borderColor: 'rgba(245,158,11,0.2)' }}>
                    <p className="text-xs" style={{ color: '#F59E0B' }}>
                      ⚠️ ยังไม่ได้ตั้งค่า <code className="px-1 py-0.5 rounded" style={{ background: '#1A1A1A' }}>RESEND_API_KEY</code> — email จะไม่ถูกส่ง
                    </p>
                    <a href="https://resend.com" target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs mt-1 hover:opacity-80"
                      style={{ color: '#F5C800' }}>
                      ขอ key ฟรีที่ resend.com <ExternalLink size={10} />
                    </a>
                  </div>
                )}
              </div>

              {/* Manual Weekly Digest */}
              <div className="rounded-2xl p-6 border" style={{ background: '#141414', borderColor: '#222' }}>
                <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#F5C800' }}>ส่ง Weekly Digest ทันที</h2>
                <p className="text-sm mb-4" style={{ color: '#777' }}>
                  ส่งสรุปการประชุมสัปดาห์นี้ไปยัง <span className="text-white">{user?.email}</span>
                </p>
                <button onClick={sendWeeklyNow} disabled={sendingDigest || !config?.hasResend}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:bg-white/5 disabled:opacity-40"
                  style={{ borderColor: '#333', color: '#E8E8E8' }}>
                  {sendingDigest ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {sendingDigest ? 'กำลังส่ง...' : 'ส่ง Weekly Digest ตอนนี้'}
                </button>
              </div>
            </div>
          )}

          {/* ── API KEYS ─────────────────────────────────────────── */}
          {tab === 'api' && (
            <div className="space-y-5 animate-in">
              <div className="rounded-2xl p-6 border" style={{ background: '#141414', borderColor: '#222' }}>
                <h2 className="text-sm font-semibold uppercase tracking-wider mb-5" style={{ color: '#F5C800' }}>API Keys</h2>
                <p className="text-xs mb-5" style={{ color: '#555' }}>
                  Keys ตั้งค่าใน <code className="px-1 py-0.5 rounded" style={{ background: '#1A1A1A', color: '#F5C800' }}>.env</code> ไม่สามารถแก้ไขผ่าน UI ได้เพื่อความปลอดภัย
                </p>

                {config && [
                  {
                    name: 'Groq API',
                    key: 'GROQ_API_KEY',
                    value: config.groqApiKey,
                    ok: config.hasGroq,
                    desc: 'Speech-to-text สำหรับ Upload File',
                    link: 'console.groq.com',
                    href: 'https://console.groq.com',
                    free: 'ฟรี 1,500 req/วัน',
                  },
                  {
                    name: 'AssemblyAI',
                    key: 'ASSEMBLYAI_API_KEY',
                    value: config.assemblyAiKey,
                    ok: config.hasAssemblyAi,
                    desc: 'Speech-to-text สำหรับ Google Drive URL',
                    link: 'assemblyai.com',
                    href: 'https://assemblyai.com',
                    free: 'ฟรี 5 ชั่วโมงแรก',
                  },
                  {
                    name: 'Resend',
                    key: 'RESEND_API_KEY',
                    value: config.resendApiKey,
                    ok: config.hasResend,
                    desc: 'ส่ง email report และ weekly digest',
                    link: 'resend.com',
                    href: 'https://resend.com',
                    free: 'ฟรี 3,000 email/เดือน',
                  },
                ].map(item => (
                  <div key={item.name} className="flex items-start justify-between py-4 border-b last:border-b-0"
                    style={{ borderColor: '#1E1E1E' }}>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-semibold text-white">{item.name}</span>
                        <StatusDot ok={item.ok} />
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>
                          {item.free}
                        </span>
                      </div>
                      <p className="text-xs mb-1" style={{ color: '#666' }}>{item.desc}</p>
                      {item.ok ? (
                        <div className="flex items-center gap-1">
                          <code className="text-xs px-2 py-1 rounded font-mono" style={{ background: '#1A1A1A', color: '#888' }}>
                            {item.value}
                          </code>
                        </div>
                      ) : (
                        <a href={item.href} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs hover:opacity-80"
                          style={{ color: '#F5C800' }}>
                          ขอ key ฟรีที่ {item.link} <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <div className="text-xs px-2 py-1 rounded font-mono" style={{ background: '#1A1A1A', color: '#555' }}>
                        {item.key}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* How to set keys */}
              <div className="rounded-2xl p-6 border" style={{ background: '#141414', borderColor: '#222' }}>
                <h3 className="text-sm font-semibold mb-4" style={{ color: '#888' }}>วิธีตั้งค่า API Keys</h3>
                <div className="rounded-xl p-4 font-mono text-xs space-y-1" style={{ background: '#0D0D0D', color: '#888' }}>
                  <div><span style={{ color: '#555' }}># ไฟล์ .env ใน root project</span></div>
                  <div><span style={{ color: '#60A5FA' }}>GROQ_API_KEY</span>=<span style={{ color: '#F5C800' }}>"gsk_..."</span></div>
                  <div><span style={{ color: '#60A5FA' }}>ASSEMBLYAI_API_KEY</span>=<span style={{ color: '#F5C800' }}>"..."</span></div>
                  <div><span style={{ color: '#60A5FA' }}>RESEND_API_KEY</span>=<span style={{ color: '#F5C800' }}>"re_..."</span></div>
                  <div><span style={{ color: '#60A5FA' }}>EMAIL_FROM</span>=<span style={{ color: '#F5C800' }}>"noreply@yourdomain.com"</span></div>
                  <div><span style={{ color: '#60A5FA' }}>ADMIN_EMAIL</span>=<span style={{ color: '#F5C800' }}>"admin@hotelplus.asia"</span></div>
                </div>
                <p className="text-xs mt-3" style={{ color: '#555' }}>
                  หลังแก้ .env ต้อง restart server: <code className="px-1 py-0.5 rounded" style={{ background: '#1A1A1A', color: '#F5C800' }}>npm run dev</code>
                </p>
              </div>
            </div>
          )}

          {/* ── SYSTEM ───────────────────────────────────────────── */}
          {tab === 'system' && (
            <div className="space-y-5 animate-in">
              {/* App Info */}
              <div className="rounded-2xl p-6 border" style={{ background: '#141414', borderColor: '#222' }}>
                <h2 className="text-sm font-semibold uppercase tracking-wider mb-5" style={{ color: '#F5C800' }}>ข้อมูลระบบ</h2>
                <div className="space-y-3">
                  {[
                    { label: 'App Name', value: 'H+ Meeting Analyzer' },
                    { label: 'Version', value: '1.0.0' },
                    { label: 'App URL', value: config?.appUrl || 'http://localhost:3000' },
                    { label: 'Email From', value: config?.emailFrom || 'ยังไม่ได้ตั้งค่า' },
                    { label: 'Admin Email', value: config?.adminEmail || 'ยังไม่ได้ตั้งค่า' },
                    { label: 'NLP Engine', value: 'Custom Rule-based (Offline)' },
                    { label: 'Speech-to-Text', value: 'Groq Whisper + AssemblyAI' },
                    { label: 'Database', value: 'PostgreSQL (Prisma ORM)' },
                    { label: 'Framework', value: 'Next.js 16 + React 18' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b last:border-b-0"
                      style={{ borderColor: '#1E1E1E' }}>
                      <span className="text-sm" style={{ color: '#666' }}>{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white">{value}</span>
                        {label === 'App URL' && <CopyButton text={value} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service Status */}
              <div className="rounded-2xl p-6 border" style={{ background: '#141414', borderColor: '#222' }}>
                <h2 className="text-sm font-semibold uppercase tracking-wider mb-5" style={{ color: '#F5C800' }}>
                  Service Status
                </h2>
                <div className="space-y-3">
                  {config && [
                    { name: 'Groq Whisper (Upload)', ok: config.hasGroq, desc: 'ถอดเสียงจากไฟล์ที่ upload' },
                    // { name: 'AssemblyAI (Drive URL)', ok: config.hasAssemblyAi, desc: 'ถอดเสียงจาก Google Drive URL' },
                    { name: 'Email Reports (Resend)', ok: config.hasResend, desc: 'ส่ง email report อัตโนมัติ' },
                    { name: 'NLP Analysis Engine', ok: true, desc: 'วิเคราะห์ transcript (offline)' },
                    { name: 'Database', ok: true, desc: 'PostgreSQL connection' },
                  ].map(({ name, ok, desc }) => (
                    <div key={name} className="flex items-center justify-between py-2 border-b last:border-b-0"
                      style={{ borderColor: '#1E1E1E' }}>
                      <div>
                        <span className="text-sm text-white">{name}</span>
                        <p className="text-xs" style={{ color: '#555' }}>{desc}</p>
                      </div>
                      <StatusDot ok={ok} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger Zone — admin only */}
              {user?.role === 'admin' && (
                <div className="rounded-2xl p-6 border" style={{ background: 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.2)' }}>
                  <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#EF4444' }}>
                    Danger Zone
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white">Reset Demo Data</p>
                        <p className="text-xs" style={{ color: '#666' }}>ลบ meeting ทั้งหมดในระบบ (ไม่สามารถกู้คืนได้)</p>
                      </div>
                      <button
                        onClick={() => { if (confirm('ลบ meeting ทั้งหมดใช่ไหม? ไม่สามารถกู้คืนได้')) alert('ฟีเจอร์นี้ต้องทำผ่าน database โดยตรงครับ') }}
                        className="px-4 py-2 rounded-xl text-xs font-semibold border transition-all hover:bg-red-500/10"
                        style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#EF4444' }}>
                        Reset Data
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
