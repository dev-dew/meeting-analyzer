'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('รหัสผ่านไม่ตรงกัน')
    if (form.password.length < 6) return setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
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
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: '#0D0D0D' }}>
      {/* Background grid */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#F5C800 1px, transparent 1px), linear-gradient(90deg, #F5C800 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm"
            style={{ background: '#F5C800', color: '#000' }}>H+</div>
          <span className="font-bold text-white">H+ Hotel Plus</span>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-1">สร้างบัญชีใหม่</h2>
          <p className="text-sm" style={{ color: '#666' }}>เข้าร่วมทีม H+ Meeting Analyzer</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'ชื่อ-นามสกุล', key: 'name', type: 'text', placeholder: 'เช่น คุณแบงค์' },
            { label: 'อีเมล', key: 'email', type: 'email', placeholder: 'your@email.com' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-2 text-white">{label}</label>
              <input type={type} value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder} required
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#444] outline-none transition-all"
                style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}
                onFocus={e => e.target.style.borderColor = '#F5C800'}
                onBlur={e => e.target.style.borderColor = '#2A2A2A'}
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium mb-2 text-white">รหัสผ่าน</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="อย่างน้อย 6 ตัวอักษร" required
                className="w-full px-4 py-3 pr-12 rounded-xl text-sm text-white placeholder-[#444] outline-none transition-all"
                style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}
                onFocus={e => e.target.style.borderColor = '#F5C800'}
                onBlur={e => e.target.style.borderColor = '#2A2A2A'}
              />
              <button type="button" onClick={() => setShowPass(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#555' }}>
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">ยืนยันรหัสผ่าน</label>
            <input type="password" value={form.confirm}
              onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
              placeholder="••••••••" required
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-[#444] outline-none transition-all"
              style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}
              onFocus={e => e.target.style.borderColor = '#F5C800'}
              onBlur={e => e.target.style.borderColor = '#2A2A2A'}
            />
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
            {loading ? <><Loader2 size={15} className="animate-spin" /> กำลังสร้างบัญชี...</> : 'สร้างบัญชี'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: '#555' }}>
            มีบัญชีแล้ว?{' '}
            <Link href="/login" className="font-semibold" style={{ color: '#F5C800' }}>
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
