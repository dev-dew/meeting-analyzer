'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, TrendingUp } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push('/dashboard')
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0D0D0D' }}>
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #111 0%, #0D0D0D 100%)' }}>
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#F5C800 1px, transparent 1px), linear-gradient(90deg, #F5C800 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />

        {/* Glow */}
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: '#F5C800' }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm"
            style={{ background: '#F5C800', color: '#000' }}>H+</div>
          <div>
            <div className="font-bold text-white text-sm">H+ Hotel Plus</div>
            <div className="text-xs" style={{ color: '#555' }}>Meeting Analyzer</div>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              วิเคราะห์การประชุม<br />
              <span style={{ color: '#F5C800' }}>ด้วย AI อัจฉริยะ</span>
            </h1>
            <p className="text-base leading-relaxed" style={{ color: '#666' }}>
              ระบบวัดคุณภาพการประชุมและตรวจจับ<br />
              สัญญาณเสี่ยงการยกเลิกสัญญา สำหรับทีม H+ Hotel Plus
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3">
            {[
              { icon: '🎯', label: 'Meeting Quality Score', desc: 'วัดคุณภาพการประชุมแบบ real-time' },
              { icon: '⚠️', label: 'Risk Detection', desc: 'ตรวจจับสัญญาณยกเลิกสัญญา' },
              { icon: '✨', label: 'AI Analysis', desc: 'วิเคราะห์ด้วย Groq AI + NLP Engine' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: 'rgba(245,200,0,0.1)' }}>{f.icon}</div>
                <div>
                  <div className="text-sm font-semibold text-white">{f.label}</div>
                  <div className="text-xs" style={{ color: '#555' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 flex gap-6">
          {[['AI', 'Powered'], ['2', 'Meeting Types'], ['Real-time', 'Analysis']].map(([v, l]) => (
            <div key={l}>
              <div className="text-lg font-bold" style={{ color: '#F5C800' }}>{v}</div>
              <div className="text-xs" style={{ color: '#555' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm"
              style={{ background: '#F5C800', color: '#000' }}>H+</div>
            <span className="font-bold text-white">H+ Hotel Plus</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1">ยินดีต้อนรับ</h2>
            <p className="text-sm" style={{ color: '#666' }}>เข้าสู่ระบบเพื่อใช้งาน Meeting Analyzer</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">อีเมล</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" required
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#444] outline-none transition-all"
                style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}
                onFocus={e => e.target.style.borderColor = '#F5C800'}
                onBlur={e => e.target.style.borderColor = '#2A2A2A'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-white">รหัสผ่าน</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm text-white placeholder-[#444] outline-none transition-all"
                  style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}
                  onFocus={e => e.target.style.borderColor = '#F5C800'}
                  onBlur={e => e.target.style.borderColor = '#2A2A2A'}
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors hover:opacity-80"
                  style={{ color: '#555' }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm border"
                style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#EF4444' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              style={{ background: '#F5C800', color: '#000' }}>
              {loading ? <><Loader2 size={15} className="animate-spin" /> กำลังเข้าสู่ระบบ...</> : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: '#555' }}>
              ยังไม่มีบัญชี?{' '}
              <Link href="/register" className="font-semibold transition-colors hover:opacity-80"
                style={{ color: '#F5C800' }}>
                สมัครสมาชิก
              </Link>
            </p>
          </div>

          {/* Demo hint */}
          
        </div>
      </div>
    </div>
  )
}
