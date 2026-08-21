'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { ShieldAlert, Maximize2, AlertTriangle, X } from 'lucide-react'

const VIOLATION_LABELS: Record<string, string> = {
  tab_switch: 'Tab Switch Detected',
  blur: 'Window Focus Lost',
  fullscreen_exit: 'Exited Fullscreen Mode',
  devtools: 'Developer Tools Opened',
  multi_session: 'Concurrent Session Detected',
  copy_paste_blocked: 'Copy/Paste / Right-Click Attempt Blocked'
}

export function ProctoringWrapper({ 
  attemptId, 
  logAction, 
  heartbeatAction,
  onWarningCountChange,
  isSubmitting = false
}: { 
  attemptId: string
  logAction: (attemptId: string, type: string, meta?: any) => Promise<void>
  heartbeatAction: (attemptId: string, token: string) => Promise<{ valid: boolean }>
  onWarningCountChange?: (count: number) => void
  isSubmitting?: boolean
}) {
  const hasLoggedDevtools = useRef(false)
  const lastLogTime = useRef<Record<string, number>>({})
  const warningCountRef = useRef(0)
  const isSubmittingRef = useRef(isSubmitting)
  const [sessionLocked, setSessionLocked] = useState(false)
  const [isProctoringStarted, setIsProctoringStarted] = useState(false)
  const [warningCount, setWarningCount] = useState(0)
  const [activeWarning, setActiveWarning] = useState<string | null>(null)
  const [showFullscreenOverlay, setShowFullscreenOverlay] = useState(false)
  const reEnterTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    isSubmittingRef.current = isSubmitting
  }, [isSubmitting])

  const handleStartFullscreen = () => {
    document.documentElement.requestFullscreen()
      .then(() => setIsProctoringStarted(true))
      .catch(() => setIsProctoringStarted(true))
  }

  // Re-enter fullscreen with overlay warning
  const forceReEnterFullscreen = useCallback(() => {
    if (isSubmittingRef.current) return
    
    setShowFullscreenOverlay(true)
    
    // Clear any existing timeout
    if (reEnterTimeoutRef.current) {
      clearTimeout(reEnterTimeoutRef.current)
    }
    
    // Auto-attempt re-enter after a short delay (browsers need user gesture, 
    // so we show a mandatory overlay that forces the user to click)
    reEnterTimeoutRef.current = setTimeout(() => {
      // Try to auto-re-enter (may fail without user gesture in some browsers)
      document.documentElement.requestFullscreen().catch(() => {
        // If auto-re-enter fails, the overlay stays visible forcing user to click
      })
    }, 500)
  }, [])

  const handleReEnterClick = () => {
    document.documentElement.requestFullscreen()
      .then(() => setShowFullscreenOverlay(false))
      .catch(() => {
        // Last resort: just hide overlay
        setShowFullscreenOverlay(false)
      })
  }

  useEffect(() => {
    const storageKey = `flint_session_${attemptId}`
    let token = sessionStorage.getItem(storageKey)
    if (!token) {
      token = Math.random().toString(36).substring(2) + Date.now().toString(36)
      sessionStorage.setItem(storageKey, token)
    }

    const rateLimitedLog = (type: string, meta?: any) => {
      // Suppress any violation logging if assessment is submitting or finished
      if (isSubmittingRef.current) return

      const now = Date.now()
      const lastTime = lastLogTime.current[type] || 0
      if (now - lastTime < 5000) return
      lastLogTime.current[type] = now

      warningCountRef.current += 1
      const newCount = warningCountRef.current
      setWarningCount(newCount)

      // Defer parent state update to avoid React setState during render console error
      setTimeout(() => {
        onWarningCountChange?.(newCount)
      }, 0)

      const label = VIOLATION_LABELS[type] || 'Violation Flagged'
      setActiveWarning(label)
      setTimeout(() => setActiveWarning(null), 5000)

      logAction(attemptId, type, meta).catch(() => {})
    }

    // Heartbeat check every 10s
    const runHeartbeat = async () => {
      try {
        const res = await heartbeatAction(attemptId, token!)
        if (!res.valid) {
          setSessionLocked(true)
        }
      } catch {
        // ignore network glitches
      }
    }

    runHeartbeat()
    const heartbeatInterval = setInterval(runHeartbeat, 10000)

    // Only attach proctoring listeners after user clicks "Start"
    if (!isProctoringStarted) {
      return () => clearInterval(heartbeatInterval)
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        rateLimitedLog('tab_switch', { action: 'hidden' })
      }
    }
    
    const handleBlur = () => {
      rateLimitedLog('blur', { action: 'window_blur' })
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !isSubmittingRef.current) {
        rateLimitedLog('fullscreen_exit', { action: 'exited_fullscreen' })
        // Immediately force re-entry
        forceReEnterFullscreen()
      } else if (document.fullscreenElement) {
        // Successfully re-entered fullscreen, hide overlay
        setShowFullscreenOverlay(false)
      }
    }

    const detectDevTools = () => {
      const threshold = 220
      const widthDiff = window.outerWidth - window.innerWidth > threshold
      const heightDiff = window.outerHeight - window.innerHeight > threshold
      if (widthDiff || heightDiff) {
        if (!hasLoggedDevtools.current) {
          rateLimitedLog('devtools', { widthDiff, heightDiff })
          hasLoggedDevtools.current = true
        }
      } else {
        hasLoggedDevtools.current = false
      }
    }

    // Disable Right-Click (ContextMenu)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      rateLimitedLog('copy_paste_blocked', { action: 'contextmenu_blocked' })
    }

    // Disable Copy, Paste, Cut
    const handleCopyPaste = (e: Event) => {
      e.preventDefault()
      rateLimitedLog('copy_paste_blocked', { action: e.type })
    }

    // Block keyboard shortcuts including Escape key warning
    // DO NOT block Undo (Ctrl+Z / Cmd+Z) or Redo (Ctrl+Y) so candidates can edit text freely
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()

      // Block Escape key (browser will still exit fullscreen, but we intercept it)
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        return
      }

      // Block F11 (toggle fullscreen shortcut)
      if (e.key === 'F11') {
        e.preventDefault()
        e.stopPropagation()
        return
      }

      // Block Alt+Tab indicator (we can't truly prevent it, but log it)
      if (e.altKey && key === 'tab') {
        e.preventDefault()
        rateLimitedLog('tab_switch', { action: 'alt_tab_attempt' })
        return
      }

      if (isCtrlOrCmd && (key === 'c' || key === 'v' || key === 'x')) {
        e.preventDefault()
        rateLimitedLog('copy_paste_blocked', { action: `shortcut_${key}` })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    window.addEventListener('resize', detectDevTools)
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('copy', handleCopyPaste)
    document.addEventListener('paste', handleCopyPaste)
    document.addEventListener('cut', handleCopyPaste)
    document.addEventListener('keydown', handleKeyDown, true) // use capture phase
    
    return () => {
      clearInterval(heartbeatInterval)
      if (reEnterTimeoutRef.current) clearTimeout(reEnterTimeoutRef.current)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      window.removeEventListener('resize', detectDevTools)
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('copy', handleCopyPaste)
      document.removeEventListener('paste', handleCopyPaste)
      document.removeEventListener('cut', handleCopyPaste)
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [attemptId, logAction, heartbeatAction, isProctoringStarted, onWarningCountChange, forceReEnterFullscreen])

  if (sessionLocked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 text-white">
        <div className="surface-card max-w-md bg-white p-6 text-center text-text">
          <h2 className="text-xl font-bold text-rose-600">Multiple Session Detected</h2>
          <p className="mt-2 text-sm text-text-muted">
            This assessment attempt was opened in another window or device. This session has been locked and flagged for review.
          </p>
          <a href="/candidate/exams" className="mt-6 inline-block rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white">
            Return to Dashboard
          </a>
        </div>
      </div>
    )
  }

  if (!isProctoringStarted) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
        <div className="surface-card max-w-lg bg-white p-8 text-center shadow-2xl rounded-2xl border space-y-4">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-text">Proctored Assessment Notice</h2>
          <p className="text-sm text-text-muted leading-relaxed">
            This session is monitored for integrity. Right-clicking, copying, pasting, tab switches, exiting fullscreen, or opening developer tools will be logged and reviewed by your administrator.
          </p>
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 font-semibold">
            ⚠️ Do NOT press Escape or exit fullscreen during the exam. Any attempt will be flagged and you will be forced back into the exam environment.
          </div>
          <div className="pt-4">
            <button
              onClick={handleStartFullscreen}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-base font-semibold text-white hover:bg-accent-strong transition shadow-lg hover:-translate-y-0.5"
            >
              <Maximize2 size={18} />
              Enter Fullscreen & Begin Assessment
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Fullscreen Re-Entry Overlay — blocks all interaction until user re-enters */}
      {showFullscreenOverlay && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
          <div className="max-w-md bg-white rounded-2xl p-8 text-center shadow-2xl border-2 border-rose-300 space-y-4 animate-in zoom-in">
            <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <AlertTriangle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-rose-700">⚠️ Fullscreen Violation!</h2>
            <p className="text-sm text-text-muted leading-relaxed">
              You exited fullscreen mode during a proctored assessment. This violation has been <strong className="text-rose-600">logged and flagged</strong> to your instructor.
            </p>
            <p className="text-xs text-rose-600 font-bold uppercase tracking-wider">
              Warning #{warningCount} recorded
            </p>
            <button
              onClick={handleReEnterClick}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-4 text-base font-bold text-white hover:bg-rose-700 transition shadow-lg"
            >
              <Maximize2 size={18} />
              Re-Enter Fullscreen Now
            </button>
            <p className="text-[11px] text-text-muted">
              You cannot continue the exam until you re-enter fullscreen mode.
            </p>
          </div>
        </div>
      )}

      {activeWarning && !showFullscreenOverlay && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="flex items-center gap-3 bg-rose-600 text-white px-5 py-3 rounded-xl shadow-2xl border border-rose-400 text-sm font-semibold">
            <AlertTriangle size={20} className="shrink-0 animate-pulse" />
            <span>⚠️ Warning #{warningCount}: {activeWarning}! Flag logged to instructor.</span>
            <button onClick={() => setActiveWarning(null)} className="ml-2 hover:opacity-80">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
