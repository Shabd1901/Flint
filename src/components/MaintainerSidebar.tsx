'use client'
import { LayoutDashboard, Users, GraduationCap, ShieldAlert } from 'lucide-react'
import { Sidebar } from './Sidebar'

export function MaintainerSidebar({ 
  signOutAction,
  profileHeader
}: { 
  signOutAction: () => Promise<void>
  profileHeader?: React.ReactNode
}) {
  return (
    <Sidebar
      title="Flint"
      role="Maintainer"
      navItems={[
        { label: 'Global Dashboard', href: '/maintainer', icon: LayoutDashboard, exact: true },
        { label: 'Admin Management', href: '/maintainer/admins', icon: Users },
        { label: 'Candidate Management', href: '/maintainer/candidates', icon: GraduationCap },
        { label: 'Integrity Violations', href: '/maintainer/violations', icon: ShieldAlert },
      ]}
      handleSignOut={signOutAction}
      profileHeader={profileHeader}
    />
  )
}
