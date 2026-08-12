'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, Menu, X, type LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  exact?: boolean
}

export function Sidebar({
  title,
  role,
  navItems,
  handleSignOut,
}: {
  title: string
  role: string
  navItems: NavItem[]
  handleSignOut: () => Promise<void>
}) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Hide sidebar completely when taking an assessment
  if (pathname.includes('/take')) {
    return null
  }

  return (
    <>
      <div className="sticky top-0 z-40 flex items-center justify-between border-b bg-surface p-4 md:hidden">
        <div>
          <p className="font-semibold tracking-tight">{title}</p>
          <p className="text-xs uppercase tracking-[0.12em] text-text-muted">{role} portal</p>
        </div>
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="rounded-md border bg-white p-2 text-text-muted hover:text-text"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {isOpen && <div className="fixed inset-0 z-40 bg-black/25 md:hidden" onClick={() => setIsOpen(false)} />}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-surface p-5 transition-transform duration-200 md:relative md:z-0 md:w-64
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div>
          <p className="text-xl font-semibold tracking-tight">{title}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">{role} portal</p>
        </div>

        <nav className="mt-6 space-y-1.5">
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
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-6 rounded-lg border bg-surface-soft p-3 text-xs text-text-muted">
          Session actions and role navigation are available here.
        </div>

        <div className="mt-auto pt-6">
          <form action={handleSignOut}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg border bg-white px-3 py-2.5 text-sm font-medium text-text-muted transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
