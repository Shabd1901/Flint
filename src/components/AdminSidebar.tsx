'use client'
import { LayoutDashboard, CheckSquare, FileText, Code2 } from 'lucide-react'
import { Sidebar } from './Sidebar'

export function AdminSidebar({ signOutAction }: { signOutAction: () => Promise<void> }) {
  return (
    <Sidebar 
      title="Flint" 
      role="Admin"
      navItems={[
        { label: 'Overview', href: '/admin', icon: LayoutDashboard },
        { label: 'Exams', href: '/admin/exams', icon: FileText },
        { label: 'Assignments', href: '/admin/assignments', icon: CheckSquare },
        { label: 'Coding Contests', href: '/admin/contests', icon: Code2 },
      ]}
      handleSignOut={signOutAction}
    />
  )
}
