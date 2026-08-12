'use client'

import { useEffect, useRef, useState } from 'react'
import { ShieldAlert, Maximize2 } from 'lucide-react'

export function ProctoringWrapper({ 
  attemptId, 
  logAction, 
  heartbeatAction 
}: { 
  attemptId: string
  logAction: (attemptId: string, type: string, meta?: any) => Promise<void>
  heartbeatAction: (attemptId: string, token: string) => Promise<{ valid: boolean }>
}) {
  const hasLoggedDevtools = useRef(false)
  const lastLogTime = useRef<Record<string, number>>({})
  const [sessionLocked, setSessionLocked] = useState(false)
  const [isProctoringStarted, setIsProctoringStarted] = useState(false)

  const handleStartFullscreen = () => {
    document.documentElement.requestFullscreen()
      .then(() => setIsProctoringStarted(true))
      .catch(() => setIsProctoringStarted(true)) // Start proctoring even if fullscreen permission is denied by browser
  }

  useEffect(() => {
    const storageKey = `flint_session_${attemptId}`
    let token = sessionStorage.getItem(storageKey)
    if (!token) {
      token = Math.random().toString(36).substring(2) + Date.now().toString(36)
      sessionStorage.setItem(storageKey, token)
    }

    const rateLimitedLog = (type: string, meta?: any) => {
      const now = Date.now()
      const lastTime = lastLogTime.current[type] || 0
      if (now - lastTime < 5000) return
      lastLogTime.current[type] = now
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
      if (!document.fullscreenElement) {
        rateLimitedLog('fullscreen_exit', { action: 'exited_fullscreen' })
      }
    }

    const detectDevTools = () => {
      // Threshold 220px to prevent false positives from 125%/150% OS display scaling
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

    const handleCopyPaste = (e: Event) => {
      e.preventDefault()
      rateLimitedLog('copy_paste_blocked', { action: e.type })
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    window.addEventListener('resize', detectDevTools)
    document.addEventListener('copy', handleCopyPaste)
    document.addEventListener('paste', handleCopyPaste)
    
    return () => {
      clearInterval(heartbeatInterval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      window.removeEventListener('resize', detectDevTools)
      document.removeEventListener('copy', handleCopyPaste)
      document.removeEventListener('paste', handleCopyPaste)
    }
  }, [attemptId, logAction, heartbeatAction, isProctoringStarted])

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
            This session is monitored for integrity. Tab switches, exiting fullscreen, opening developer tools, or opening multiple tabs will be logged and reviewed by your administrator.
          </p>
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

  return null
}
