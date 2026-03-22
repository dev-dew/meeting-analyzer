'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, PlusCircle, FileText, LogOut, TrendingUp, Archive, Users, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/analyze',   icon: PlusCircle,      label: 'New Analysis' },
  { href: '/meetings',  icon: Archive,          label: 'Meeting Records' },
  { href: '/users',     icon: Users,            label: 'All Users' },
  { href: '/settings',  icon: Settings,         label: 'Settings' },
]

export function Sidebar() {
  const path = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user) setUser(d.user) })
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  return (
    <aside className="fixed left-0 top-0 h-full w-64 flex flex-col z-40"
      style={{ background: '#111111', borderRight: '1px solid #222' }}>
      {/* Logo */}
      <div className="px-6 py-6 border-b border-[#222]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm"
            style={{ background: '#F5C800', color: '#000' }}>H+</div>
          <div>
            <div className="font-semibold text-sm text-white leading-none">Hotel Plus</div>
            <div className="text-xs mt-0.5" style={{ color: '#555' }}>Meeting Analyzer</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = path === href || path.startsWith(href + '/')
          return (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active ? 'text-black' : 'text-[#888] hover:text-white hover:bg-white/5'
              )}
              style={active ? { background: '#F5C800', color: '#000' } : {}}>
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User profile */}
      {user && (
        <div className="mx-3 mb-3 p-3 rounded-xl border" style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'rgba(245,200,0,0.15)', color: '#F5C800' }}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">{user.name}</div>
              <div className="text-xs truncate" style={{ color: '#555' }}>{user.email}</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: user.role === 'admin' ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.07)', color: user.role === 'admin' ? '#A78BFA' : '#666' }}>
              {user.role === 'admin' ? 'Admin' : 'Member'}
            </span>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs transition-colors hover:opacity-80"
              style={{ color: '#555' }}>
              <LogOut size={12} /> ออกจากระบบ
            </button>
          </div>
        </div>
      )}

      {/* Bottom */}
      <div className="px-6 py-4 border-t border-[#222]">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} style={{ color: '#F5C800' }} />
          <span className="text-xs" style={{ color: '#444' }}>H+ Hotel Plus © 2025</span>
        </div>
      </div>
    </aside>
  )
}
