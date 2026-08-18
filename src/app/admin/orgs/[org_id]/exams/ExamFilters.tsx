'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition, useEffect } from 'react'
import { Search } from 'lucide-react'

export function ExamFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentQuery = searchParams.get('q') || ''
      if (currentQuery !== searchQuery) {
        updateFilters({ q: searchQuery, page: '1' }) // reset page on search
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  function updateFilters(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    
    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search exams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-9 pr-3 rounded-md border bg-white outline-none ring-accent focus:ring-2 text-sm"
        />
        {isPending && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        )}
      </div>
      
      <select
        defaultValue={searchParams.get('status') || ''}
        onChange={(e) => updateFilters({ status: e.target.value, page: '1' })}
        className="h-10 px-3 rounded-md border bg-white outline-none ring-accent focus:ring-2 text-sm sm:w-40"
      >
        <option value="">All Statuses</option>
        <option value="draft">Draft</option>
        <option value="live">Live</option>
        <option value="closed">Closed</option>
      </select>

      <select
        defaultValue={searchParams.get('sort') || 'created_at-desc'}
        onChange={(e) => updateFilters({ sort: e.target.value, page: '1' })}
        className="h-10 px-3 rounded-md border bg-white outline-none ring-accent focus:ring-2 text-sm sm:w-48"
      >
        <option value="created_at-desc">Newest First</option>
        <option value="created_at-asc">Oldest First</option>
        <option value="title-asc">Title (A-Z)</option>
        <option value="title-desc">Title (Z-A)</option>
        <option value="duration_minutes-desc">Duration (Longest)</option>
        <option value="duration_minutes-asc">Duration (Shortest)</option>
      </select>
    </div>
  )
}
