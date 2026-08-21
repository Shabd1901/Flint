'use client'
import { useEffect, useState } from 'react'
import { LayoutDashboard, Code, BookOpen, Terminal, ArrowLeft } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export function CandidateSidebar({ signOutAction }: { signOutAction: () => Promise<void> }) {
  const pathname = usePathname()
  const match = pathname.match(/^\/candidate\/orgs\/([^/]+)/)
  const orgId = match ? match[1] : null

  const [orgName, setOrgName] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (orgId) {
      const fetchOrg = async () => {
        const supabase = createClient()
        const { data } = await supabase.from('orgs').select('name').eq('id', orgId).single()
        if (data) setOrgName(data.name)
      }
      fetchOrg()
    } else {
      setOrgName(undefined)
    }
  }, [orgId])

  let navItems = []

  if (orgId) {
    navItems = [
      { label: 'Back to Home', href: '/candidate', icon: ArrowLeft },
      { label: 'My Exams', href: `/candidate/orgs/${orgId}/exams`, icon: BookOpen },
      { label: 'My Assignments', href: `/candidate/orgs/${orgId}/assignments`, icon: Code },
      { label: 'Coding Contests', href: `/candidate/orgs/${orgId}/contests`, icon: Terminal, badge: 'TBD' },
    ]
  } else {
    navItems = [
      { label: 'Dashboard', href: '/candidate', icon: LayoutDashboard, exact: true },
    ]
  }

  return (
    <Sidebar
      title="Flint"
      role="Candidate"
      navItems={navItems}
      handleSignOut={signOutAction}
      orgName={orgName}
    />
  )
}
