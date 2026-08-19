'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { User, Mail, IdCard, Shield, LogOut, ChevronDown } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export interface ProfileData {
  name: string
  email: string
  role: string
  tp_uid?: string | null
}

export function UserProfileHeader({
  profile,
  signOutAction
}: {
  profile: ProfileData
  signOutAction?: () => Promise<void>
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  // Hide completely on exam take page to avoid proctoring distractions
  if (pathname.includes('/take')) {
    return null
  }

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Helper to generate initials (e.g. Raunak Nayak -> RN)
  const getInitials = (name: string) => {
    if (!name) return 'U'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  const initials = getInitials(profile.name)

  const handleSignOutSubmit = async () => {
    setIsSigningOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      if (signOutAction) {
        await signOutAction().catch(() => {})
      }
    } catch {
      // ignore errors
    } finally {
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <div className="relative z-30" ref={menuRef}>
      {/* Circle Avatar Button in Top Right */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full p-1 border border-line bg-white hover:bg-surface-soft hover:border-accent/40 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-accent"
        title="View User Details"
      >
        <div className="w-9 h-9 rounded-full bg-accent text-white font-bold text-xs flex items-center justify-center shadow-inner tracking-wider">
          {initials}
        </div>
        <span className="text-xs font-semibold text-text max-w-[120px] truncate hidden sm:inline-block pr-1">
          {profile.name}
        </span>
        <ChevronDown size={14} className={`text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180 text-accent' : ''}`} />
      </button>

      {/* Popover Card with User Details */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 surface-card border border-line bg-white shadow-xl rounded-2xl p-4 animate-in fade-in zoom-in-95 duration-150 space-y-4">
          {/* Header section with large avatar */}
          <div className="flex items-center gap-3 pb-3 border-b border-line">
            <div className="w-12 h-12 rounded-full bg-accent text-white font-extrabold text-sm flex items-center justify-center shadow-md shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-text truncate">{profile.name}</h4>
              <p className="text-[11px] text-text-muted truncate flex items-center gap-1 mt-0.5">
                <Mail size={12} className="shrink-0 text-text-muted" />
                <span className="truncate">{profile.email}</span>
              </p>
            </div>
          </div>

          {/* Simple Details List: username, useremail, T&P UID */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-surface-soft border border-line/60">
              <span className="text-text-muted flex items-center gap-1.5 font-medium">
                <User size={14} className="text-accent" />
                Username
              </span>
              <span className="font-semibold text-text truncate max-w-[130px]">{profile.name}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-surface-soft border border-line/60">
              <span className="text-text-muted flex items-center gap-1.5 font-medium">
                <Mail size={14} className="text-accent" />
                User Email
              </span>
              <span className="font-semibold text-text truncate max-w-[130px]" title={profile.email}>{profile.email}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-surface-soft border border-line/60">
              <span className="text-text-muted flex items-center gap-1.5 font-medium">
                <IdCard size={14} className="text-accent" />
                T&amp;P UID
              </span>
              {profile.tp_uid ? (
                <span className="font-mono font-bold text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20 text-[11px]">
                  {profile.tp_uid}
                </span>
              ) : (
                <span className="text-text-muted font-medium italic">N/A</span>
              )}
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-surface-soft border border-line/60">
              <span className="text-text-muted flex items-center gap-1.5 font-medium">
                <Shield size={14} className="text-accent" />
                Role
              </span>
              <span className="capitalize font-bold text-text bg-white px-2 py-0.5 rounded border border-line">
                {profile.role}
              </span>
            </div>
          </div>

          {/* Sign Out Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleSignOutSubmit}
              disabled={isSigningOut}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition text-xs font-bold disabled:opacity-50"
            >
              <LogOut size={14} />
              {isSigningOut ? 'Signing Out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
