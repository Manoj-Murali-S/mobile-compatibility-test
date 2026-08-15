'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Smartphone,
  Link2,
  Upload,
  Download,
  HardDrive,
  Settings,
  ChevronRight,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'

const adminMenuItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Brands',
    href: '/admin/brands',
    icon: Package,
  },
  {
    title: 'Mobiles',
    href: '/admin/mobiles',
    icon: Smartphone,
  },
  {
    title: 'Compatibility',
    href: '/admin/compatibility',
    icon: Link2,
  },
  {
    title: 'Import',
    href: '/admin/import',
    icon: Upload,
  },
  {
    title: 'Export',
    href: '/admin/export',
    icon: Download,
  },
  {
    title: 'Backup & Restore',
    href: '/admin/backup',
    icon: HardDrive,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const items = [
    ...adminMenuItems,
    ...(user?.role === 'admin' || user?.role === 'superadmin' ? [{
      title: 'Users',
      href: '/admin/users',
      icon: Users,
    }] : [])
  ]

  return (
    <aside className="w-64 bg-card border-r border-border h-screen sticky top-0 overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-accent-foreground font-bold text-sm">MC</span>
          </div>
          <div>
            <h1 className="text-sm font-bold">Mobile Admin</h1>
            <p className="text-xs text-muted-foreground">Finder Pro</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-foreground hover:bg-muted'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="flex-1">{item.title}</span>
              {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
        <div className="space-y-4 text-xs text-muted-foreground flex flex-col">
          <p>Logged in as {user?.name}</p>
          <div className="flex flex-col gap-2">
            <Link href="/" className="block">
              <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                ← Back to Web
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start text-xs text-destructive hover:text-destructive hover:bg-destructive/10">
              Logout
            </Button>
          </div>
        </div>
      </div>
    </aside>
  )
}
