'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { Package, Smartphone, Link2, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getBrandCount } from '@/lib/repository/brands'
import { getMobileCount } from '@/lib/repository/mobiles'
import { getAccessoryCount } from '@/lib/repository/accessories'
import { getSetting } from '@/lib/repository/settings'
import { getPendingCount } from '@/lib/repository/sync-queue'

interface DashboardStats {
  totalBrands: number
  totalMobiles: number
  totalAccessories: number
  pendingSyncItems: number
  lastSync: string
  lastBackup: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBrands: 0,
    totalMobiles: 0,
    totalAccessories: 0,
    pendingSyncItems: 0,
    lastSync: 'Never',
    lastBackup: 'Never',
  })

  useEffect(() => {
    async function loadStats() {
      const [brands, mobiles, accessories, pending, lastSync] = await Promise.all([
        getBrandCount(),
        getMobileCount(),
        getAccessoryCount(),
        getPendingCount(),
        getSetting<string>('last_sync_at'),
      ])
      setStats({
        totalBrands: brands,
        totalMobiles: mobiles,
        totalAccessories: accessories,
        pendingSyncItems: pending,
        lastSync: lastSync ? new Date(lastSync).toLocaleString() : 'Never',
        lastBackup: 'See Backup page',
      })
    }
    void loadStats()
  }, [])

  const statCards = [
    {
      title: 'Total Brands',
      value: stats.totalBrands,
      icon: Package,
      color: 'bg-blue-500/10 text-blue-600',
    },
    {
      title: 'Total Mobiles',
      value: stats.totalMobiles,
      icon: Smartphone,
      color: 'bg-purple-500/10 text-purple-600',
    },
    {
      title: 'Total Accessories',
      value: stats.totalAccessories,
      icon: Link2,
      color: 'bg-green-500/10 text-green-600',
    },
    {
      title: 'Pending Sync',
      value: stats.pendingSyncItems,
      icon: TrendingUp,
      color: stats.pendingSyncItems > 0 ? 'bg-amber-500/10 text-amber-600' : 'bg-orange-500/10 text-orange-600',
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back to Mobile Compatibility Admin</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card key={idx} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Live from SQLite
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* System Info and Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Last Sync</p>
              <p className="text-sm font-medium">{stats.lastSync}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending Changes</p>
              <p className="text-sm font-medium">{stats.pendingSyncItems} item(s)</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Storage</p>
              <p className="text-sm font-medium">SQLite (local file)</p>
            </div>
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Database Health</span>
                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
                  Healthy
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <a href="/admin/settings" className="text-xs text-accent hover:underline">
              View All
            </a>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[].slice(0, 5).map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                  <div className="mt-1">
                    {log.status === 'success' && (
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    )}
                    {log.status === 'error' && (
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                    )}
                    {log.status === 'warning' && (
                      <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{log.action}</p>
                      <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{log.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <a
              href="/admin/brands"
              className="p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-center text-sm font-medium"
            >
              Manage Brands
            </a>
            <a
              href="/admin/mobiles"
              className="p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-center text-sm font-medium"
            >
              Manage Mobiles
            </a>
            <a
              href="/admin/import"
              className="p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-center text-sm font-medium"
            >
              Import Data
            </a>
            <a
              href="/admin/backup"
              className="p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-center text-sm font-medium"
            >
              Backup System
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
