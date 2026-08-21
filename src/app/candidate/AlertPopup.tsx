'use client'

import { useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'

export function AlertPopup({ 
  error, 
  success, 
  info 
}: { 
  error?: string, 
  success?: string, 
  info?: string 
}) {
  useEffect(() => {
    // Clear URL params without reloading to prevent double toasts
    if (error || success || info) {
      window.history.replaceState(null, '', '/candidate')
    }

    if (error) {
      toast.error(error, { duration: 4000 })
    }
    if (success) {
      toast.success(success, { duration: 4000 })
    }
    if (info) {
      toast(info, { icon: 'ℹ️', duration: 4000 })
    }
  }, [error, success, info])
  
  return <Toaster position="top-center" />
}
