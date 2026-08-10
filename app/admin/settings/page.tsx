'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { mockSystemLogs } from '@/lib/admin-mock-data'
import { AlertCircle as AlertIcon } from 'lucide-react'
import OfflineSyncSettings from '@/components/offline-sync-settings'

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage system settings and view activity logs</p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="appname">Application Name</Label>
            <Input
              id="appname"
              defaultValue="Mobile Compatibility Finder"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              defaultValue="UTC (Coordinated Universal Time)"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="language">Default Language</Label>
            <Input
              id="language"
              defaultValue="English"
              className="mt-2"
            />
          </div>

          <div className="border-t pt-6">
            <Button>Save Changes</Button>
          </div>
        </CardContent>
      </Card>

      <OfflineSyncSettings />

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-xs text-muted-foreground">Version</p>
              <p className="font-medium mt-1">v1.0.0</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-xs text-muted-foreground">Database</p>
              <p className="font-medium mt-1">PostgreSQL</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-medium mt-1 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Operational
              </p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-xs text-muted-foreground">Uptime</p>
              <p className="font-medium mt-1">45 days</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-xs text-muted-foreground">API Calls</p>
              <p className="font-medium mt-1">1.2M / month</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-xs text-muted-foreground">Storage Used</p>
              <p className="font-medium mt-1">2.4 GB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">System Activity Log</CardTitle>
          <CardDescription>Recent administrative actions and system events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockSystemLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <span className="text-sm font-medium">{log.action}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{log.user}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{log.timestamp}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          log.status === 'success'
                            ? 'bg-green-500/10 text-green-700 border-green-200'
                            : log.status === 'error'
                              ? 'bg-red-500/10 text-red-700 border-red-200'
                              : 'bg-yellow-500/10 text-yellow-700 border-yellow-200'
                        }
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground truncate max-w-xs">
                        {log.details}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-destructive/10 p-4 rounded-lg flex items-start gap-3">
            <AlertIcon className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              These actions cannot be undone. Please proceed with caution.
            </p>
          </div>

          <Button variant="destructive" className="w-full">
            Clear All Cache
          </Button>

          <Button variant="destructive" className="w-full">
            Reset to Default Settings
          </Button>

          <Button variant="destructive" className="w-full">
            Delete All Data
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
