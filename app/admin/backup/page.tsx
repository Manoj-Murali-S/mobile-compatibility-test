'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { HardDrive, Plus, MoreHorizontal, Download, RotateCcw, Trash2, AlertCircle } from 'lucide-react'
import { mockBackupRecords, BackupRecord } from '@/lib/admin-mock-data'
import { getMobiles } from '@/lib/repository/mobiles'
import { getBrands } from '@/lib/repository/brands'
import { getAllCompatibility } from '@/lib/repository/compatibility'
import { getAccessories } from '@/lib/repository/accessories'
import { getAllSettings } from '@/lib/repository/settings'
import { downloadJson } from '@/lib/download-utils'

async function exportLiveSnapshot() {
  const [brands, mobiles, compatibility, accessories, settings] = await Promise.all([
    getBrands(),
    getMobiles(),
    getAllCompatibility(),
    getAccessories(),
    getAllSettings(),
  ])
  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    source: 'SQLite (local)',
    brands,
    mobiles,
    compatibility,
    accessories,
    settings,
  }
}

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupRecord[]>(mockBackupRecords)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true)
    const snapshot = await exportLiveSnapshot()
    const name = `Full Backup ${new Date().toISOString().split('T')[0]}`
    downloadJson(snapshot, `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`)

    const newBackup: BackupRecord = {
      id: String(backups.length + 1),
      name,
      size: `${(JSON.stringify(snapshot).length / 1024).toFixed(1)} KB`,
      type: 'full',
      createdAt: new Date().toLocaleString(),
      status: 'completed',
    }

    setBackups([newBackup, ...backups])
    setIsCreatingBackup(false)
  }

  const handleDownload = async (backup: BackupRecord) => {
    const snapshot = await exportLiveSnapshot()
    downloadJson({ backup, snapshot }, `${backup.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`)
  }

  const handleRestore = (id: string) => {
    alert(`Restore backup ${id}? This will replace all current data.`)
  }

  const handleDelete = (id: string) => {
    setBackups(backups.filter((b) => b.id !== id))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-700 border-green-200'
      case 'failed': return 'bg-red-500/10 text-red-700 border-red-200'
      case 'in-progress': return 'bg-blue-500/10 text-blue-700 border-blue-200'
      default: return ''
    }
  }

  const latestBackup = backups[0]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Backup & Restore</h1>
        <p className="text-muted-foreground mt-1">Manage your local SQLite database backups</p>
      </div>

      {/* Latest Backup Info */}
      {latestBackup && (
        <Card className="border-green-200 bg-green-500/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-green-600" />
              Latest Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Backup Name</p>
                <p className="font-medium">{latestBackup.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Size</p>
                <p className="font-medium">{latestBackup.size}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">{latestBackup.createdAt}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create New Backup</CardTitle>
          <CardDescription>Export a full JSON snapshot of your local SQLite catalog</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-500/10 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Creates a JSON file downloaded to your computer. The backup contains all brands, mobiles, compatibility groups, and accessories from your local SQLite database.
              </p>
            </div>

            <Button
              onClick={handleCreateBackup}
              disabled={isCreatingBackup}
              className="w-full"
              size="lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isCreatingBackup ? 'Creating Backup…' : 'Create Full Backup (Download JSON)'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Backup History ({backups.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Backup Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backups.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell>
                      <span className="font-medium">{backup.name}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {backup.type === 'full' ? 'Full' : 'Incremental'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{backup.size}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{backup.createdAt}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(backup.status)}>
                        {backup.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownload(backup)}>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRestore(backup.id)}>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Restore
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(backup.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Backup Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Backup Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium">Storage Type</p>
              <p className="text-xs text-muted-foreground">Local SQLite database file</p>
            </div>
            <Badge variant="outline">SQLite</Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium">Data Persistence</p>
              <p className="text-xs text-muted-foreground">Survives app close and system restart</p>
            </div>
            <Badge variant="default" className="bg-green-500/10 text-green-700 border-green-200">Persistent</Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium">Sync to Cloud</p>
              <p className="text-xs text-muted-foreground">Use the Sync button in the top bar</p>
            </div>
            <Badge variant="outline">Optional</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
