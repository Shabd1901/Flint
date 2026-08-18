'use client'
import { LayoutDashboard, Code, BookOpen, Terminal, Building, ArrowLeft } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { usePathname } from 'next/navigation'

export function CandidateSidebar({ signOutAction }: { signOutAction: () => Promise<void> }) {
  const pathname = usePathname()
  const match = pathname.match(/^\/candidate\/orgs\/([^/]+)/)
  const orgId = match ? match[1] : null

  let navItems = []

  if (orgId) {
    navItems = [
      { label: '← Back to Home', href: '/candidate', icon: ArrowLeft },
      { label: 'Classroom', href: `/candidate/orgs/${orgId}`, icon: Building, exact: true },
      { label: 'My Exams', href: `/candidate/orgs/${orgId}/exams`, icon: BookOpen },
      { label: 'My Assignments', href: `/candidate/orgs/${orgId}/assignments`, icon: Code },
      { label: 'Coding Contests', href: `/candidate/orgs/${orgId}/contests`, icon: Terminal },
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
    />
  )
}
