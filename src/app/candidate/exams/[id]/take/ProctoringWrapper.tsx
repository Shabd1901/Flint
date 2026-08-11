'use client'

import { useEffect, useRef, useState } from 'react'

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
  const sessionToken = useRef<string>(Math.random().toString(36).substring(2) + Date.now().toString(36))
  const [sessionLocked, setSessionLocked] = useState(false)

  useEffect(() => {
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
        const res = await heartbeatAction(attemptId, sessionToken.current)
        if (!res.valid) {
          setSessionLocked(true)
        }
      } catch {
        // ignore network glitches
      }
    }

    runHeartbeat()
    const heartbeatInterval = setInterval(runHeartbeat, 10000)

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
      const threshold = 160
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

    // Request fullscreen on mount
    document.documentElement.requestFullscreen().catch(() => {})

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
  }, [attemptId, logAction, heartbeatAction])

  if (sessionLocked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 text-white">
        <div className="surface-card max-w-md bg-white p-6 text-center text-text">
          <h2 className="text-xl font-bold text-rose-600">Multiple Session Detected</h2>
          <p className="mt-2 text-sm text-text-muted">
            This exam attempt was opened in another window or device. This session has been locked and flagged for review.
          </p>
          <a href="/candidate/exams" className="mt-6 inline-block rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white">
            Return to Dashboard
          </a>
        </div>
      </div>
    )
  }

  return null
}
