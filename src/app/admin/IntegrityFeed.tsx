'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { AlertTriangle, MonitorOff, Copy, UserX, Ghost } from 'lucide-react'

import { formatTime } from '@/utils/formatDate'

// Helper to map violation types to readable text and icons
const VIOLATION_MAP: Record<string, { label: string, icon: any, color: string }> = {
  tab_switch: { label: 'Switched tabs', icon: MonitorOff, color: 'text-amber-500 bg-amber-50' },
  blur: { label: 'Lost window focus', icon: Ghost, color: 'text-amber-500 bg-amber-50' },
  fullscreen_exit: { label: 'Exited fullscreen', icon: MonitorOff, color: 'text-rose-500 bg-rose-50' },
  devtools: { label: 'Opened DevTools', icon: AlertTriangle, color: 'text-rose-500 bg-rose-50' },
  multi_session: { label: 'Multiple sessions', icon: UserX, color: 'text-purple-500 bg-purple-50' },
  copy_paste_blocked: { label: 'Attempted copy/paste', icon: Copy, color: 'text-amber-500 bg-amber-50' },
}

export function IntegrityFeed({ initialEvents, orgId }: { initialEvents: any[], orgId: string }) {
  const [events, setEvents] = useState(initialEvents)
  
  // Real-time would go here, but for now we'll just beautifully render the initial list
  // and use a subtle auto-refresh interval for demonstration.
  
  return (
    <div className="flex flex-col h-full bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b bg-surface-soft/30">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          </div>
          <h2 className="font-semibold tracking-tight text-sm">Live Integrity Feed</h2>
        </div>
        <span className="text-xs text-text-muted font-medium bg-surface-soft px-2 py-1 rounded-md">Real-time</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[400px] scrollbar-thin">
        {events.length === 0 ? (
          <div className="p-8 text-center text-sm text-text-muted flex flex-col items-center justify-center h-full">
            <MonitorOff className="w-8 h-8 mb-3 opacity-20" />
            <p>No integrity flags yet.</p>
            <p className="text-xs opacity-60">Monitoring active sessions...</p>
          </div>
        ) : (
          events.map((event, i) => {
            const map = VIOLATION_MAP[event.type] || { label: event.type, icon: AlertTriangle, color: 'text-gray-500 bg-gray-50' }
            const Icon = map.icon
            
            return (
              <div 
                key={event.id} 
                className="group flex items-start gap-3 p-3 rounded-lg hover:bg-surface-soft/60 transition-colors animate-in fade-in slide-in-from-top-2 duration-300"
                style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
              >
                <div className={`p-2 rounded-md ${map.color} shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold truncate text-text">
                      {event.candidate_name}
                    </p>
                    <span className="text-[10px] uppercase font-medium text-text-muted shrink-0" suppressHydrationWarning>
                      {formatTime(event.occurred_at)}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1.5">
                    <span className="truncate">{map.label}</span>
                    <span className="w-1 h-1 rounded-full bg-line"></span>
                    <span className="truncate opacity-80">{event.exam_title}</span>
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
