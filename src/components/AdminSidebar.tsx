'use client'
import { LayoutDashboard, CheckSquare, FileText, Code2, Building, ArrowLeft, Users } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { usePathname } from 'next/navigation'

export function AdminSidebar({ signOutAction }: { signOutAction: () => Promise<void> }) {
  const pathname = usePathname()
  const match = pathname.match(/^\/admin\/orgs\/([^/]+)/)
  const orgId = match ? match[1] : null

  let navItems = []

  if (orgId) {
    navItems = [
      { label: 'All Organizations', href: '/admin/orgs', icon: ArrowLeft },
      { label: 'Classroom', href: `/admin/orgs/${orgId}`, icon: LayoutDashboard, exact: true },
      { label: 'Exams', href: `/admin/orgs/${orgId}/exams`, icon: FileText },
      { label: 'Assignments', href: `/admin/orgs/${orgId}/assignments`, icon: CheckSquare },
      { label: 'People', href: `/admin/orgs/${orgId}/people`, icon: Users },
      { label: 'Coding Contests', href: `/admin/orgs/${orgId}/contests`, icon: Code2, badge: 'TBD' },
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
    />
  )
}
