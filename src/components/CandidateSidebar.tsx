'use client'
import { LayoutDashboard, Code, BookOpen, Terminal } from 'lucide-react'
import { Sidebar } from './Sidebar'

export function CandidateSidebar({ signOutAction }: { signOutAction: () => Promise<void> }) {
  return (
    <Sidebar 
      title="Flint" 
      role="Candidate"
      navItems={[
        { label: 'Dashboard', href: '/candidate', icon: LayoutDashboard },
        { label: 'My Exams', href: '/candidate/exams', icon: BookOpen },
        { label: 'My Assignments', href: '/candidate/assignments', icon: Code },
        { label: 'Coding Contests', href: '/candidate/contests', icon: Terminal },
      ]}
      handleSignOut={signOutAction}
    />
  )
}
