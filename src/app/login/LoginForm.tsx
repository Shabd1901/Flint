'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Shield, GraduationCap, Lock, Mail } from 'lucide-react'
import { SubmitButton } from './SubmitButton'
import { login } from './actions'

export function LoginForm({ error, success }: { error?: string; success?: string }) {
  const [roleMode, setRoleMode] = useState<'candidate' | 'admin'>('candidate')

  return (
    <div className="surface-card p-6 md:p-8 space-y-6">
      {/* 2 Role Selection Buttons */}
      <div className="grid grid-cols-2 gap-2 bg-surface-soft p-1.5 rounded-xl border border-line">
        <button
          type="button"
          onClick={() => setRoleMode('candidate')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
            roleMode === 'candidate'
              ? 'bg-accent text-white shadow-md'
              : 'text-text-muted hover:text-text hover:bg-white/60'
          }`}
        >
          <GraduationCap size={16} />
          Sign in as Candidate
        </button>

        <button
          type="button"
          onClick={() => setRoleMode('admin')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
            roleMode === 'admin'
              ? 'bg-accent text-white shadow-md'
              : 'text-text-muted hover:text-text hover:bg-white/60'
          }`}
        >
          <Shield size={16} />
          Sign in as Admin
        </button>
      </div>

      <div>
        <h2 className="text-xl font-bold tracking-tight text-text">
          {roleMode === 'candidate' ? 'Candidate Sign In' : 'Admin Sign In'}
        </h2>
        <p className="mt-1 text-xs text-text-muted">
          {roleMode === 'candidate'
            ? 'Access your enrolled classrooms, pending exams, and assignment tasks.'
            : 'Access classroom administration, exam creation, and grading controls.'}
        </p>
      </div>

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 animate-in fade-in">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 animate-in fade-in">
          {error}
        </div>
      )}

      <form action={login} className="space-y-4">
        <input type="hidden" name="expected_role" value={roleMode} />

        <label className="grid gap-1 text-xs font-semibold text-text-muted">
          <span>Email Address</span>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              name="email"
              type="email"
              required
              className="w-full h-10 pl-9 pr-3 rounded-lg border bg-white text-xs outline-none ring-accent focus:ring-2 text-text"
              placeholder={roleMode === 'candidate' ? 'candidate@university.edu' : 'admin@org.edu'}
            />
          </div>
        </label>

        <label className="grid gap-1 text-xs font-semibold text-text-muted">
          <span>Password</span>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              name="password"
              type="password"
              required
              className="w-full h-10 pl-9 pr-3 rounded-lg border bg-white text-xs outline-none ring-accent focus:ring-2 text-text"
              placeholder="••••••••"
            />
          </div>
        </label>

        <SubmitButton />
      </form>

      {roleMode === 'candidate' && (
        <div className="pt-2 border-t text-center text-xs text-text-muted">
          Don&apos;t have a candidate account?{' '}
          <Link href="/register" className="font-semibold text-accent hover:underline">
            Register Candidate Account
          </Link>
        </div>
      )}
    </div>
  )
}
