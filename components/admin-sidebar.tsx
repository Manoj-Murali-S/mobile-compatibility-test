'use client'

import Link from 'next/link'
import Image from 'next/image'
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
import { ThemeSwitcher } from '@/components/theme-switcher'

const baseMenuItems = [
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
]

const editorMenuItems = [
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
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  let items = [...baseMenuItems]
  
  if (user?.role === 'superadmin' || user?.role === 'admin' || user?.role === 'editor') {
    items = [...items, ...editorMenuItems]
  }
  
  if (user?.role === 'superadmin' || user?.role === 'admin') {
    items.push({
      title: 'Users',
      href: '/admin/users',
      icon: Users,
    })
  }

  if (user?.role === 'superadmin') {
    items.push({
      title: 'Settings',
      href: '/admin/settings',
      icon: Settings,
    })
  }

  return (
    <aside className="w-64 bg-card border-r border-border h-screen sticky top-0 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border shrink-0">
        <Link href="/admin" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Cell's and Cell"
            width={120}
            height={48}
            className="object-contain"
            style={{ maxHeight: 48 }}
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
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
      <div className="p-4 border-t border-border bg-card shrink-0">
        <div className="space-y-4 text-xs text-muted-foreground flex flex-col">
          <div className="flex items-center justify-between">
            <p>Logged in as {user?.name}</p>
            <ThemeSwitcher />
          </div>
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
