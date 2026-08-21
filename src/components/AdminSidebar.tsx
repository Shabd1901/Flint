'use client'
import { useEffect, useState } from 'react'
import { LayoutDashboard, CheckSquare, FileText, Code2, Building, ArrowLeft, Users } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export function AdminSidebar({ 
  signOutAction,
  profileHeader
}: { 
  signOutAction: () => Promise<void>
  profileHeader?: React.ReactNode
}) {
  const pathname = usePathname()
  const match = pathname.match(/^\/admin\/orgs\/([^/]+)/)
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
      { label: 'All Organizations', href: '/admin/orgs', icon: ArrowLeft },
      { label: 'Classroom', href: `/admin/orgs/${orgId}`, icon: LayoutDashboard, exact: true },
      { label: 'Exams', href: `/admin/orgs/${orgId}/exams`, icon: FileText },
      { label: 'Assignments', href: `/admin/orgs/${orgId}/assignments`, icon: CheckSquare },
      { label: 'People', href: `/admin/orgs/${orgId}/people`, icon: Users },
      { label: 'Coding Contests', href: `/admin/orgs/${orgId}/contests`, icon: Code2 },
    ]
  } else {
    navItems = [
      { label: 'Organizations', href: '/admin/orgs', icon: Building, exact: true },
    ]
  }

  return (
    <Sidebar
      title="Flint"
      role="Admin"
      navItems={navItems}
      handleSignOut={signOutAction}
      orgName={orgName}
      profileHeader={profileHeader}
    />
  )
}
