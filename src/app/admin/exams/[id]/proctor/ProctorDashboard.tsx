'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, MessageSquare, ShieldAlert, Power, AlertTriangle, Radio } from 'lucide-react'
import Link from 'next/link'
import { forceSubmitSession, sendProctorMessage } from './actions'

interface ViolationEvent {
  id: string
  attempt_id: string
  type: string
  created_at: string
}

export function ProctorDashboard({ examId, examTitle, initialAttempts }: { examId: string, examTitle: string, initialAttempts: any[] }) {
  const [attempts, setAttempts] = useState<any[]>(initialAttempts)
  const [violations, setViolations] = useState<ViolationEvent[]>([])
  const [msgText, setMsgText] = useState('')
  const supabase = createClient()

  useEffect(() => {
    // 1. Listen to exam_attempts changes (new joins, heartbeat updates, status changes)
    const attemptsSub = supabase.channel('proctor-attempts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exam_attempts', filter: `exam_id=eq.${examId}` }, (payload) => {
        setAttempts(current => {
          if (payload.eventType === 'INSERT') {
            if (payload.new.status !== 'in_progress') return current
            return [...current, payload.new] // Missing profiles relation data, but handles raw updates
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new.status !== 'in_progress') {
              return current.filter(a => a.id !== payload.new.id) // Remove if submitted
            }
            return current.map(a => a.id === payload.new.id ? { ...a, ...payload.new } : a)
          } else if (payload.eventType === 'DELETE') {
            return current.filter(a => a.id !== payload.old.id)
          }
          return current
        })
      }).subscribe()

    // 2. Listen to live violation_events
    const violationsSub = supabase.channel('proctor-violations')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'violation_events' }, (payload) => {
        // Only keep if the attempt is currently in our attempts list
        setAttempts(current => {
          if (current.some(a => a.id === payload.new.attempt_id)) {
            setViolations(prev => [payload.new as ViolationEvent, ...prev].slice(0, 50)) // keep last 50
          }
          return current
        })
      }).subscribe()

    return () => {
      attemptsSub.unsubscribe()
      violationsSub.unsubscribe()
    }
  }, [examId, supabase])

  const handleForceSubmit = async (attemptId: string) => {
    if (confirm("Are you sure you want to force-submit this candidate's exam? They will be immediately kicked out.")) {
      await forceSubmitSession(attemptId)
    }
  }

  const handleSendMessage = async (attemptId: string) => {
    const text = prompt("Enter a warning or message to send to the candidate immediately:")
    if (text?.trim()) {
      await sendProctorMessage(attemptId, text.trim())
    }
  }

  return (
    <div className="container-page py-6 md:py-8 space-y-6">
      <Link href={`/admin/exams/${examId}`} className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-accent transition">
        <ArrowLeft size={14} />
        Back to Exam Settings
      </Link>

      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Radio className="text-rose-500 animate-pulse" /> Live Proctor Console
          </h1>
          <p className="text-text-muted mt-1">{examTitle}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg font-semibold">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
          {attempts.length} Active Session{attempts.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Candidates List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-semibold">Monitored Candidates</h2>
          {attempts.length === 0 ? (
            <div className="surface-card p-12 text-center text-text-muted">
              <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No active sessions right now.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {attempts.map(a => {
                const profile = a.profiles as any
                const vCount = Number(a.violation_score) || 0
                return (
                  <div key={a.id} className={`surface-card p-4 flex flex-wrap justify-between items-center gap-4 border-l-4 ${vCount > 5 ? 'border-l-rose-500 bg-rose-50/30' : vCount > 0 ? 'border-l-amber-400' : 'border-l-emerald-400'}`}>
                    <div>
                      <h3 className="font-semibold">{profile?.name || 'Unknown Candidate'}</h3>
                      <p className="text-xs text-text-muted font-mono">{profile?.email || 'N/A'}</p>
                      <div className="flex gap-3 mt-2 text-[10px] uppercase font-semibold tracking-wider">
                        <span className={vCount > 0 ? 'text-amber-600' : 'text-emerald-600'}>{vCount} Violations Logged</span>
                        {a.last_heartbeat ? (
                          <span className={Date.now() - new Date(a.last_heartbeat).getTime() > 10000 ? 'text-rose-500' : 'text-blue-500'}>
                            {Date.now() - new Date(a.last_heartbeat).getTime() > 10000 ? 'Offline (Lost Sync)' : 'Online'}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleSendMessage(a.id)} className="p-2 text-text-muted hover:text-blue-600 hover:bg-blue-50 rounded-md transition" title="Message Candidate">
                        <MessageSquare size={18} />
                      </button>
                      <button onClick={() => handleForceSubmit(a.id)} className="p-2 text-text-muted hover:text-rose-600 hover:bg-rose-50 rounded-md transition" title="Force Submit & Kick">
                        <Power size={18} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Live Violation Feed */}
        <div className="space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            Live Violation Feed
          </h2>
          <div className="surface-card p-4 h-[600px] overflow-y-auto space-y-3">
            {violations.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-8">Waiting for events...</p>
            ) : (
              violations.map(v => {
                const attempt = attempts.find(a => a.id === v.attempt_id)
                const candName = (attempt?.profiles as any)?.name || 'Unknown'
                return (
                  <div key={v.id} className="text-xs border-b border-line pb-3 last:border-0 last:pb-0 animate-in fade-in slide-in-from-top-2">
                    <p className="font-semibold mb-0.5 text-text-muted">{candName}</p>
                    <p className="text-amber-700 font-medium">{v.type.replace(/_/g, ' ').toUpperCase()}</p>
                    <p className="text-[10px] text-text-muted mt-1">{new Date(v.created_at).toLocaleTimeString()}</p>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
