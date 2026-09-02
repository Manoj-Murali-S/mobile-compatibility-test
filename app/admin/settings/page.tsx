'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import OfflineSyncSettings from '@/components/offline-sync-settings'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { getSetting, resetSystemDatabase, setSetting } from '@/lib/repository/settings'
import { AlertCircle as AlertIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function SettingsPage() {
  const [trialEndDate, setTrialEndDate] = useState<string>('2027-01-01')
  const [trialAlertDays, setTrialAlertDays] = useState<string>('5')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function loadSettings() {
      const endDate = await getSetting<string>('trialEndDate')
      const alertDays = await getSetting<string>('trialAlertDays')
      if (endDate) setTrialEndDate(endDate)
      if (alertDays) setTrialAlertDays(alertDays)
    }
    loadSettings()
  }, [])

  const handleSaveGeneral = async () => {
    setIsSaving(true)
    try {
      await setSetting('trialEndDate', trialEndDate)
      await setSetting('trialAlertDays', trialAlertDays)
      alert("Settings saved successfully!")
    } catch (err) {
      console.error(err)
      alert("Failed to save settings.")
    } finally {
      setIsSaving(false)
    }
  }

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
          <CardDescription>Configure application-wide trial limits and alerts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="trialEndDate">Trial End Date</Label>
              <Input
                id="trialEndDate"
                type="date"
                value={trialEndDate}
                onChange={(e) => setTrialEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trialAlertDays">Alert Threshold (Days)</Label>
              <Input
                id="trialAlertDays"
                type="number"
                min="0"
                value={trialAlertDays}
                onChange={(e) => setTrialAlertDays(e.target.value)}
                placeholder="e.g., 5"
              />
              <p className="text-xs text-muted-foreground">
                Days before trial end to start showing alerts.
              </p>
            </div>
          </div>

          <div className="border-t pt-6">
            <Button disabled={isSaving} onClick={handleSaveGeneral}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <OfflineSyncSettings />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Choose light, dark, or follow the device theme.</CardDescription>
        </CardHeader>
        <CardContent><ThemeSwitcher /></CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30 shadow-destructive/5">
        <CardHeader>
          <CardTitle className="text-base text-destructive font-semibold">Danger Zone</CardTitle>
          <CardDescription>Permanently clear local data and start over.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
            <div>
              <p className="font-semibold text-sm text-foreground">Reset Catalog Database</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                This will delete all brands, mobiles, categories, and compatibility rules. This action cannot be undone.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={async () => {
                if (confirm("WARNING: This will permanently wipe all local database records (SQLite and IndexedDB) and re-seed default categories. Are you absolutely sure?")) {
                  try {
                    await resetSystemDatabase()
                    alert("Database reset completed successfully. The application will now reload.")
                    window.location.reload()
                  } catch (err) {
                    console.error(err)
                    alert("Failed to reset database.")
                  }
                }
              }}
            >
              Reset Database
            </Button>
          </div>
        </CardContent>
      </Card>

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
      {/* <Card>
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
      </Card> */}

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
