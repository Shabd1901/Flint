'use client'

import { useEffect, useRef } from 'react'

export function ProctoringWrapper({ attemptId, logAction }: { attemptId: string, logAction: (attemptId: string, type: string, meta?: any) => Promise<void> }) {
  const hasLoggedDevtools = useRef(false)

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logAction(attemptId, 'tab_switch', { action: 'hidden' }).catch(() => {})
      }
    }
    
    const handleBlur = () => {
      logAction(attemptId, 'blur', { action: 'window_blur' }).catch(() => {})
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        logAction(attemptId, 'fullscreen_exit', { action: 'exited_fullscreen' }).catch(() => {})
      }
    }

    const detectDevTools = () => {
      const threshold = 160
      const widthDiff = window.outerWidth - window.innerWidth > threshold
      const heightDiff = window.outerHeight - window.innerHeight > threshold
      if (widthDiff || heightDiff) {
        if (!hasLoggedDevtools.current) {
          logAction(attemptId, 'devtools', { widthDiff, heightDiff }).catch(() => {})
          hasLoggedDevtools.current = true
        }
      } else {
        hasLoggedDevtools.current = false
      }
    }

    // Attempt to request fullscreen on mount
    document.documentElement.requestFullscreen().catch(() => {})

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    window.addEventListener('resize', detectDevTools)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      window.removeEventListener('resize', detectDevTools)
    }
  }, [attemptId, logAction])

  return null
}
