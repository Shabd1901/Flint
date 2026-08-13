'use client'
import { LayoutDashboard, Users } from 'lucide-react'
import { Sidebar } from './Sidebar'

export function MaintainerSidebar({ signOutAction }: { signOutAction: () => Promise<void> }) {
  return (
    <Sidebar
      title="Flint"
      role="Maintainer"
      navItems={[
        { label: 'Global Dashboard', href: '/maintainer', icon: LayoutDashboard, exact: true },
        { label: 'Admin Management', href: '/maintainer/admins', icon: Users },
      ]}
      handleSignOut={signOutAction}
    />
  )
}
