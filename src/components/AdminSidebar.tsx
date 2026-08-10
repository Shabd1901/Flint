'use client'
import { LayoutDashboard, CheckSquare, FileText } from 'lucide-react'
import { Sidebar } from './Sidebar'

export function AdminSidebar({ signOutAction }: { signOutAction: () => Promise<void> }) {
  return (
    <Sidebar 
      title="Flint" 
      role="Admin"
      navItems={[
        { label: 'Overview', href: '/admin', icon: LayoutDashboard },
        { label: 'Assignments', href: '/admin/assignments', icon: CheckSquare },
        { label: 'Exams', href: '/admin/exams', icon: FileText },
      ]}
      handleSignOut={signOutAction}
    />
  )
}
