'use client'
import { LayoutDashboard, ServerCrash } from 'lucide-react'
import { Sidebar } from './Sidebar'

export function MaintainerSidebar({ signOutAction }: { signOutAction: () => Promise<void> }) {
  return (
    <Sidebar 
      title="Flint" 
      role="Maintainer"
      navItems={[
        { label: 'Global Dashboard', href: '/maintainer', icon: LayoutDashboard },
      ]}
      handleSignOut={signOutAction}
    />
  )
}
