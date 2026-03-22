'use client'
import { useState, useEffect } from 'react'
import { PlusCircle, Pencil, Trash2, X, Loader2, Users, Shield, UserCircle, Eye, EyeOff } from 'lucide-react'

interface User {
  id: string; name: string; email: string; role: string
  createdAt: string; _count: { meetings: number }
}

interface UserForm {
  name: string; email: string; password: string; role: string
}

const EMPTY_FORM: UserForm = { name: '', email: '', password: '', role: 'member' }

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [form, setForm] = useState<UserForm>(EMPTY_FORM)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null)
  const [currentUserId, setCurrentUserId] = useState('')

  useEffect(() => {
    fetchUsers()
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user) setCurrentUserId(d.user.id) })
  }, [])

  async function fetchUsers() {
    setLoading(true)
    const res = await fetch('/api/users')
    const data = await res.json()
    setUsers(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  function openCreate() {
    setEditUser(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowPass(false)
    setShowModal(true)
  }

  function openEdit(u: User) {
    setEditUser(u)
    setForm({ name: u.name, email: u.email, password: '', role: u.role })
    setError('')
    setShowPass(false)
    setShowModal(true)
  }

  async function handleSave() {
    setError('')
    if (!form.name.trim() || !form.email.trim()) return setError('กรุณากรอกชื่อและอีเมล')
    if (!editUser && !form.password) return setError('กรุณากรอกรหัสผ่าน')
    if (form.password && form.password.length < 6) return setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัว')

    setSaving(true)
    try {
      const payload: any = { name: form.name, email: form.email, role: form.role }
      if (form.password) payload.password = form.password

      if (editUser && (!editUser.id || editUser.id === 'undefined' || editUser.id === 'null')) {
        throw new Error('User ID is required for updates')
      }

      const res = editUser
        ? await fetch(`/api/users/${editUser.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, password: form.password }) })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setShowModal(false)
      fetchUsers()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(u: User) {
    if (!u?.id || u.id === 'undefined' || u.id === 'null') {
      setError('User ID is required for deletion')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/users/${u.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDeleteConfirm(null)
      fetchUsers()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = { background: '#1A1A1A', border: '1px solid #2A2A2A', color: '#E8E8E8' }

  const adminCount = users.filter(u => u.role === 'admin').length
  const memberCount = users.filter(u => u.role === 'member').length
  const totalMeetings = users.reduce((s, u) => s + u._count.meetings, 0)

  return (
    <div className="p-8 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">All Users</h1>
          <p className="text-sm mt-1" style={{ color: '#666' }}>จัดการสมาชิกและสิทธิ์การเข้าถึง</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: '#F5C800', color: '#000' }}>
          <PlusCircle size={14} /> เพิ่มผู้ใช้ใหม่
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: Users, label: 'ผู้ใช้ทั้งหมด', value: users.length, color: '#F5C800' },
          { icon: Shield, label: 'Admin', value: adminCount, color: '#A78BFA' },
          { icon: UserCircle, label: 'Member', value: memberCount, color: '#60A5FA' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-2xl p-5 border" style={{ background: '#141414', borderColor: '#222' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: `${color}18` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{value}</div>
            <div className="text-sm" style={{ color: '#666' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* User table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: '#141414', borderColor: '#222' }}>
        {/* Table header */}
        <div className="grid text-xs font-medium px-6 py-3 border-b"
          style={{ gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 100px', borderColor: '#1E1E1E', color: '#555' }}>
          <span>ชื่อ</span>
          <span>อีเมล</span>
          <span>Role</span>
          <span className="text-center">Meetings</span>
          <span>สมัครเมื่อ</span>
          <span className="text-center">Actions</span>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-[#F5C800] border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm" style={{ color: '#555' }}>กำลังโหลด...</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#1A1A1A' }}>
            {users.map((u, i) => {
              const isMe = u.id === currentUserId
              return (
                <div key={u.id}
                  className="grid items-center px-6 py-4 hover:bg-white/[0.02] transition-colors"
                  style={{ gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 100px', background: i % 2 === 1 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                  {/* Name */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: 'rgba(245,200,0,0.12)', color: '#F5C800' }}>
                      {u.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white flex items-center gap-2">
                        {u.name}
                        {isMe && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,200,0,0.15)', color: '#F5C800' }}>คุณ</span>}
                      </div>
                    </div>
                  </div>
                  {/* Email */}
                  <div className="text-sm truncate" style={{ color: '#888' }}>{u.email}</div>
                  {/* Role */}
                  <div>
                    <span className="text-xs px-2.5 py-1 rounded-full border"
                      style={u.role === 'admin'
                        ? { background: 'rgba(167,139,250,0.1)', color: '#A78BFA', borderColor: 'rgba(167,139,250,0.2)' }
                        : { background: 'rgba(96,165,250,0.1)', color: '#60A5FA', borderColor: 'rgba(96,165,250,0.2)' }}>
                      {u.role === 'admin' ? 'Admin' : 'Member'}
                    </span>
                  </div>
                  {/* Meetings count */}
                  <div className="text-center">
                    <span className="text-sm font-semibold" style={{ color: '#F5C800' }}>{u._count.meetings}</span>
                    <span className="text-xs ml-1" style={{ color: '#555' }}>meetings</span>
                  </div>
                  {/* Joined date */}
                  <div className="text-xs" style={{ color: '#555' }}>
                    {new Date(u.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openEdit(u)}
                      className="p-1.5 rounded-lg transition-all hover:bg-blue-500/20"
                      style={{ color: '#60A5FA' }} title="แก้ไข">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => { setDeleteConfirm(u); setError('') }}
                      disabled={isMe}
                      className="p-1.5 rounded-lg transition-all hover:bg-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ color: '#EF4444' }} title="ลบ">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Create/Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="w-full max-w-md rounded-2xl p-6 border animate-in"
            style={{ background: '#141414', borderColor: '#333' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">
                {editUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ color: '#666' }}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {[
                { label: 'ชื่อ-นามสกุล *', key: 'name', type: 'text', placeholder: 'เช่น คุณแบงค์' },
                { label: 'อีเมล *', key: 'email', type: 'email', placeholder: 'bank@hotelplus.asia' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-white mb-2">{label}</label>
                  <input type={type} value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 rounded-xl text-sm placeholder-[#444] outline-none focus:ring-1 focus:ring-[#F5C800]"
                    style={inputStyle} />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  รหัสผ่าน {editUser && <span className="text-xs font-normal" style={{ color: '#555' }}>(เว้นว่างถ้าไม่ต้องการเปลี่ยน)</span>}
                </label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder={editUser ? 'เว้นว่างถ้าไม่เปลี่ยน' : 'อย่างน้อย 6 ตัวอักษร'}
                    className="w-full px-4 py-3 pr-11 rounded-xl text-sm placeholder-[#444] outline-none focus:ring-1 focus:ring-[#F5C800]"
                    style={inputStyle} />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#555' }}>
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'member', label: 'Member', desc: 'วิเคราะห์ meeting ได้', color: '#60A5FA' },
                    { value: 'admin', label: 'Admin', desc: 'จัดการ user ได้', color: '#A78BFA' },
                  ].map(r => (
                    <button key={r.value} type="button" onClick={() => setForm(f => ({ ...f, role: r.value }))}
                      className="p-3 rounded-xl border text-left transition-all"
                      style={form.role === r.value
                        ? { background: `${r.color}15`, borderColor: r.color }
                        : { background: '#1A1A1A', borderColor: '#2A2A2A' }}>
                      <div className="text-sm font-semibold mb-0.5" style={{ color: form.role === r.value ? r.color : '#E8E8E8' }}>{r.label}</div>
                      <div className="text-xs" style={{ color: '#555' }}>{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl text-sm border"
                  style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#EF4444' }}>
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold border hover:bg-white/5"
                  style={{ borderColor: '#333', color: '#E8E8E8' }}>ยกเลิก</button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90"
                  style={{ background: '#F5C800', color: '#000' }}>
                  {saving ? <><Loader2 size={14} className="animate-spin" /> กำลังบันทึก...</> : (editUser ? 'บันทึก' : 'สร้างผู้ใช้')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={e => { if (e.target === e.currentTarget) setDeleteConfirm(null) }}>
          <div className="w-full max-w-sm rounded-2xl p-6 border animate-in"
            style={{ background: '#141414', borderColor: '#333' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(239,68,68,0.15)' }}>
              <Trash2 size={20} style={{ color: '#EF4444' }} />
            </div>
            <h3 className="text-lg font-bold text-white text-center mb-2">ลบผู้ใช้</h3>
            <p className="text-sm text-center mb-1" style={{ color: '#999' }}>
              คุณแน่ใจที่จะลบ <span className="text-white font-medium">{deleteConfirm.name}</span> ?
            </p>
            <p className="text-xs text-center mb-6" style={{ color: '#EF4444' }}>
              meeting ทั้งหมด {deleteConfirm._count.meetings} รายการจะถูกลบด้วย
            </p>
            {error && (
              <div className="px-4 py-3 rounded-xl text-sm border mb-4"
                style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#EF4444' }}>
                {error}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold border hover:bg-white/5"
                style={{ borderColor: '#333', color: '#E8E8E8' }}>ยกเลิก</button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={saving}
                className="flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-90"
                style={{ background: '#EF4444', color: '#fff' }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                ลบเลย
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
