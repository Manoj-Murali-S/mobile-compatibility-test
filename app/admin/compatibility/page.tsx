'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { mockCompatibilityGroups, CompatibilityGroup } from '@/lib/admin-mock-data'
import { CompatibilityDialog } from '@/components/admin/compatibility-dialog'

export default function CompatibilityPage() {
  const [groups, setGroups] = useState<CompatibilityGroup[]>(mockCompatibilityGroups)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<CompatibilityGroup | null>(null)

  const handleAddGroup = () => {
    setSelectedGroup(null)
    setIsDialogOpen(true)
  }

  const handleEditGroup = (group: CompatibilityGroup) => {
    setSelectedGroup(group)
    setIsDialogOpen(true)
  }

  const handleDeleteGroup = (id: string) => {
    setGroups(groups.filter((g) => g.id !== id))
  }

  const handleSaveGroup = (group: CompatibilityGroup) => {
    if (selectedGroup) {
      setGroups(groups.map((g) => (g.id === group.id ? group : g)))
    } else {
      setGroups([...groups, { ...group, id: String(groups.length + 1) }])
    }
    setIsDialogOpen(false)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Compatibility Groups</h1>
          <p className="text-muted-foreground mt-1">
            Organize devices into compatibility groups
          </p>
        </div>
        <Button onClick={handleAddGroup} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Group
        </Button>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <Card key={group.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{group.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {group.description}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditGroup(group)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteGroup(group.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Devices:</span>
                  <Badge variant="secondary">{group.devices}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Accessories:</span>
                  <Badge variant="secondary">{group.accessories}</Badge>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge
                    variant="outline"
                    className={
                      group.status === 'active'
                        ? 'bg-green-500/10 text-green-700 border-green-200'
                        : ''
                    }
                  >
                    {group.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* All Groups Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Groups ({groups.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Devices</TableHead>
                  <TableHead>Accessories</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell>
                      <span className="font-medium">{group.name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground truncate max-w-xs">
                        {group.description}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{group.devices}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{group.accessories}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          group.status === 'active'
                            ? 'bg-green-500/10 text-green-700 border-green-200'
                            : ''
                        }
                      >
                        {group.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{group.createdAt}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditGroup(group)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteGroup(group.id)}
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

      {/* Compatibility Dialog */}
      <CompatibilityDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        group={selectedGroup}
        onSave={handleSaveGroup}
      />
    </div>
  )
}
