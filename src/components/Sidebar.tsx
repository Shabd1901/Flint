'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { LogOut, Menu, X, type LucideIcon } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  exact?: boolean
  badge?: string
}

export function Sidebar({
  title,
  role,
  navItems,
  handleSignOut,
  orgName,
  profileHeader,
}: {
  title: string
  role: string
  navItems: NavItem[]
  handleSignOut?: () => Promise<void>
  orgName?: string
  profileHeader?: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Hide sidebar completely when taking an assessment
  if (pathname.includes('/take')) {
    return null
  }

  const onSignOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSigningOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      if (handleSignOut) {
        await handleSignOut().catch(() => {})
      }
    } catch {
      // ignore errors
    } finally {
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <>
      <div className="sticky top-0 z-[100] flex items-center justify-between border-b bg-surface p-3 md:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="rounded-md border bg-white p-2 text-text-muted hover:text-text focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2">
            <Image src="/logo.jpeg" alt="Flint Logo" width={24} height={24} className="hidden sm:block" />
            <div>
              <p className="font-bold tracking-tight text-text leading-tight">{title}</p>
              <p className="text-[9px] uppercase tracking-[0.14em] text-text-muted font-bold">{role} portal</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-[110]">
          {profileHeader}
        </div>
      </div>

      {isOpen && <div className="fixed inset-0 z-[998] bg-black/25 md:hidden" onClick={() => setIsOpen(false)} />}

      <aside
        className={`
          fixed inset-y-0 left-0 z-[999] flex w-72 flex-col border-r bg-surface p-5 transition-transform duration-200 md:relative md:z-0 md:w-64
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex items-center gap-3">
          <Image src="/logo.jpeg" alt="Flint Logo" width={32} height={32} />
          <div>
            <p className="text-xl font-semibold tracking-tight">{title}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">{role} portal</p>
          </div>
        </div>

        {orgName && (
          <div className="mt-6 rounded-lg border border-accent/20 bg-accent/5 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Current Classroom</p>
            <p className="truncate text-sm font-semibold text-accent mt-0.5" title={orgName}>{orgName}</p>
          </div>
        )}

        <nav className={`space-y-1.5 ${orgName ? 'mt-4' : 'mt-6'}`}>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`group flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'border-accent/30 bg-orange-50 text-accent'
                    : 'border-transparent text-text-muted hover:border-line hover:bg-surface-soft hover:text-text'
                }`}
              >
                <Icon size={18} className={`transition ${isActive ? 'text-accent' : 'text-text-muted group-hover:text-text'}`} />
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 border border-amber-200">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto pt-6">
          <form onSubmit={onSignOutSubmit}>
            <button
              type="submit"
              disabled={isSigningOut}
              className="flex w-full items-center justify-center gap-2 rounded-lg border bg-white px-3 py-2.5 text-sm font-medium text-text-muted transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
            >
              <LogOut size={16} />
              {isSigningOut ? 'Signing out...' : 'Sign out'}
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
