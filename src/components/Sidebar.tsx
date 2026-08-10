'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LogOut } from 'lucide-react'

export interface NavItem {
  label: string;
  href: string;
  icon: any;
}

export function Sidebar({ title, role, navItems, handleSignOut }: { title: string, role: string, navItems: NavItem[], handleSignOut: () => Promise<void> }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Close sidebar on route change on mobile
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-zinc-950 border-b border-zinc-800 sticky top-0 z-40">
        <div>
          <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{title}</h2>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-zinc-400 hover:text-white transition-colors p-2 -mr-2">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-zinc-950/80 backdrop-blur-xl border-r border-zinc-800 p-6 flex flex-col gap-8 transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:w-64 md:bg-zinc-900/50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="hidden md:block">
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{title}</h2>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1.5">{role} Portal</p>
        </div>

        <nav className="flex flex-col gap-1.5 flex-1 mt-4 md:mt-0">
          <div className="md:hidden mb-6">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{role} Portal</p>
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            // Exact match or sub-route match (excluding root mismatch)
            const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/')
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold transition-all duration-200 group
                  ${isActive 
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-900/10' 
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent'
                  }
                `}
              >
                <Icon size={20} className={isActive ? 'text-blue-400' : 'text-zinc-500 group-hover:text-zinc-400 transition-colors'} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-zinc-800/50">
          <form action={handleSignOut}>
            <button 
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-zinc-900 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 font-semibold rounded-xl border border-zinc-800 hover:border-red-500/20 transition-all duration-200 group"
            >
              <LogOut size={18} className="text-zinc-500 group-hover:text-red-400 transition-colors" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
