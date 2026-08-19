'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { User, Mail, IdCard, Shield, LogOut, ChevronDown, Edit3, Save, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { updateProfileAction } from '@/app/actions/userProfile'

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
  const [isEditing, setIsEditing] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isSaving, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [nameVal, setNameVal] = useState(profile.name)
  const [tpUidVal, setTpUidVal] = useState(profile.tp_uid || '')

  const menuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    setNameVal(profile.name)
    setTpUidVal(profile.tp_uid || '')
  }, [profile])

  // Hide completely on exam take page to avoid proctoring distractions
  if (pathname.includes('/take')) {
    return null
  }

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setIsEditing(false)
        setErrorMsg(null)
        setSuccessMsg(null)
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

  const handleSaveProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await updateProfileAction(formData)
      if (res?.error) {
        setErrorMsg(res.error)
      } else {
        setSuccessMsg('Profile updated globally!')
        setTimeout(() => {
          setIsEditing(false)
          setSuccessMsg(null)
          router.refresh()
        }, 1000)
      }
    })
  }

  return (
    <div className="relative z-30" ref={menuRef}>
      {/* Circle Avatar Button in Top Right */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen)
          if (isOpen) {
            setIsEditing(false)
            setErrorMsg(null)
            setSuccessMsg(null)
          }
        }}
        className="flex items-center gap-2 rounded-full p-1 border border-line bg-white hover:bg-surface-soft hover:border-accent/40 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-accent"
        title="View User Profile Details"
      >
        <div className="w-9 h-9 rounded-full bg-accent text-white font-bold text-xs flex items-center justify-center shadow-inner tracking-wider">
          {initials}
        </div>
        <span className="text-xs font-semibold text-text max-w-[120px] truncate hidden sm:inline-block pr-1">
          {profile.name}
        </span>
        <ChevronDown size={14} className={`text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180 text-accent' : ''}`} />
      </button>

      {/* Popover Card with User Details & Edit Option */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 surface-card border border-line bg-white shadow-xl rounded-2xl p-4 animate-in fade-in zoom-in-95 duration-150 space-y-4">
          {/* Header section with avatar */}
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-full bg-accent text-white font-extrabold text-xs flex items-center justify-center shadow-md shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-text truncate">{profile.name}</h4>
                <p className="text-[10px] text-text-muted truncate flex items-center gap-1 mt-0.5">
                  <Mail size={11} className="shrink-0 text-text-muted" />
                  <span className="truncate">{profile.email}</span>
                </p>
              </div>
            </div>

            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="p-1.5 rounded-lg border bg-surface-soft hover:bg-white text-accent hover:border-accent transition text-xs font-semibold flex items-center gap-1 shrink-0"
                title="Edit Profile Details"
              >
                <Edit3 size={13} />
                <span>Edit</span>
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold flex items-center gap-1.5 animate-in fade-in">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 size={14} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {isEditing ? (
            /* EDIT FORM MODE */
            <form onSubmit={handleSaveProfile} className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-text-muted flex items-center gap-1">
                  <User size={12} className="text-accent" /> Full Name
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  value={nameVal}
                  onChange={(e) => setNameVal(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-md border bg-white text-xs outline-none ring-accent focus:ring-2 text-text"
                  placeholder="Full Registered Name"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-text-muted flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <IdCard size={12} className="text-accent" /> T&amp;P UID
                  </span>
                  <span className="text-[9px] text-text-muted font-normal">Format: 24-ITB01-28</span>
                </label>
                <input
                  name="tp_uid"
                  type="text"
                  value={tpUidVal}
                  onChange={(e) => setTpUidVal(e.target.value.toUpperCase())}
                  className="w-full h-8 px-2.5 rounded-md border bg-white text-xs font-mono uppercase outline-none ring-accent focus:ring-2 text-text"
                  placeholder="e.g. 24-ITB01-28"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false)
                    setErrorMsg(null)
                    setSuccessMsg(null)
                    setNameVal(profile.name)
                    setTpUidVal(profile.tp_uid || '')
                  }}
                  className="flex-1 py-1.5 rounded-lg border bg-white text-xs font-semibold text-text hover:bg-surface-soft transition text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-1.5 rounded-lg bg-accent text-white text-xs font-bold hover:bg-accent-strong transition flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save size={12} /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* VIEW MODE */
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
          )}

          {/* Sign Out Button */}
          {!isEditing && (
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
          )}
        </div>
      )}
    </div>
  )
}
