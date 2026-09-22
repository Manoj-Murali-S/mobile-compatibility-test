'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
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
  Tag,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Globe,
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
    title: 'Categories',
    href: '/admin/categories',
    icon: Tag,
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
  const [isCollapsed, setIsCollapsed] = useState(false)

  let items: any[] = []

  if (user?.role === 'superadmin' || user?.role === 'admin' || user?.role === 'editor') {
    // Admin, Editor, Superadmin
    items = [...baseMenuItems, ...editorMenuItems]
  } else if (user?.role === 'viewer') {
    // Viewer
    items = [
      ...baseMenuItems.filter(item => item.title !== 'Dashboard'),
      ...editorMenuItems.filter(item => item.title === 'Export')
    ]
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
    <aside className={cn("bg-card border-r border-border h-screen sticky top-0 flex flex-col transition-all duration-300 z-20", isCollapsed ? "w-20" : "w-64")}>
      {/* Header */}
      <div className={cn("p-4 border-b border-border shrink-0 flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
        {!isCollapsed && (
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
        )}
        <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2 flex-1 overflow-y-auto overflow-x-hidden">
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
                  : 'text-foreground hover:bg-muted',
                isCollapsed ? 'justify-center px-2' : ''
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <Icon className={cn("shrink-0", isCollapsed ? "w-5 h-5" : "w-4 h-4")} />
              {!isCollapsed && (
                <>
                  <span className="flex-1 whitespace-nowrap">{item.title}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto shrink-0" />}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-card shrink-0">
        <div className={cn("text-xs text-muted-foreground flex", isCollapsed ? "flex-col items-center gap-4" : "flex-col space-y-4")}>
          {!isCollapsed && (
            <div className="flex items-center justify-between">
              <p className="truncate pr-2">Logged in as {user?.email}</p>
              {/* <ThemeSwitcher /> */}
            </div>
          )}
          {isCollapsed && <ThemeSwitcher isCollapsed={isCollapsed} />}
          <div className="flex flex-col gap-2 w-full">
            <div className="flex gap-2 w-full">
              <Link href="/" className={`block w-full ${isCollapsed ? 'flex justify-center' : 'flex-1'}`}>
                <Button variant="outline" size={isCollapsed ? "icon" : "sm"} className={cn("rounded-full transition-colors", isCollapsed ? "w-10 h-10" : "w-full justify-start text-xs h-9")} title={isCollapsed ? "Back to Web" : undefined}>
                  {isCollapsed ? <Globe className="w-5 h-5" /> : "← Back to Web"}
                </Button>
              </Link>
              {!isCollapsed && (
                <ThemeSwitcher />
              )}
            </div>
            <Button variant="ghost" size={isCollapsed ? "icon" : "sm"} onClick={signOut} className={cn("w-full text-destructive hover:text-destructive hover:bg-destructive/10", isCollapsed ? "justify-center" : "justify-start text-xs")} title={isCollapsed ? "Logout" : undefined}>
              {isCollapsed ? <LogOut className="w-4 h-4" /> : "Logout"}
            </Button>
          </div>
        </div>
      </div>
    </aside>
  )
}
