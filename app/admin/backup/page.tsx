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

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupRecord[]>(mockBackupRecords)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true)
    // Simulate backup process
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const newBackup: BackupRecord = {
      id: String(backups.length + 1),
      name: `Full Backup ${new Date().toISOString().split('T')[0]}`,
      size: '2.5 MB',
      type: 'full',
      createdAt: new Date().toLocaleString(),
      status: 'completed',
    }

    setBackups([newBackup, ...backups])
    setIsCreatingBackup(false)
  }

  const handleRestore = (id: string) => {
    alert(`Restore backup ${id}? This will replace all current data.`)
  }

  const handleDelete = (id: string) => {
    setBackups(backups.filter((b) => b.id !== id))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-700 border-green-200'
      case 'failed':
        return 'bg-red-500/10 text-red-700 border-red-200'
      case 'in-progress':
        return 'bg-blue-500/10 text-blue-700 border-blue-200'
      default:
        return ''
    }
  }

  const latestBackup = backups[0]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Backup & Restore</h1>
        <p className="text-muted-foreground mt-1">Manage your database backups and restore points</p>
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
          <CardDescription>Take a full backup of your entire database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-500/10 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Full backups may take 1-2 minutes. During this time, the system will continue to
                function normally.
              </p>
            </div>

            <Button
              onClick={handleCreateBackup}
              disabled={isCreatingBackup}
              className="w-full"
              size="lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isCreatingBackup ? 'Creating Backup...' : 'Create Full Backup'}
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
                          <DropdownMenuItem>
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
              <p className="text-sm font-medium">Automatic Backups</p>
              <p className="text-xs text-muted-foreground">Daily at 2:00 AM UTC</p>
            </div>
            <Badge variant="default">Enabled</Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium">Retention Policy</p>
              <p className="text-xs text-muted-foreground">Keep last 30 days of backups</p>
            </div>
            <Badge variant="outline">30 days</Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium">Storage Location</p>
              <p className="text-xs text-muted-foreground">Local server storage</p>
            </div>
            <Badge variant="outline">Local</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
