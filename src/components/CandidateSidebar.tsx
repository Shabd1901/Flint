'use client'
import { LayoutDashboard, Code, BookOpen } from 'lucide-react'
import { Sidebar } from './Sidebar'

export function CandidateSidebar({ signOutAction }: { signOutAction: () => Promise<void> }) {
  return (
    <Sidebar 
      title="Flint" 
      role="Candidate"
      navItems={[
        { label: 'Dashboard', href: '/candidate', icon: LayoutDashboard },
        { label: 'My Assignments', href: '/candidate/assignments', icon: Code },
        { label: 'My Exams', href: '/candidate/exams', icon: BookOpen },
      ]}
      handleSignOut={signOutAction}
    />
  )
}
