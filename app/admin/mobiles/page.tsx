'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import { Plus, MoreHorizontal, Pencil, Trash2, Search } from 'lucide-react'
import { mockMobiles, AdminMobile } from '@/lib/admin-mock-data'
import { MobileDialog } from '@/components/admin/mobile-dialog'

export default function MobilesPage() {
  const [mobiles, setMobiles] = useState<AdminMobile[]>(mockMobiles)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedMobile, setSelectedMobile] = useState<AdminMobile | null>(null)

  const filteredMobiles = mobiles.filter(
    (m) =>
      m.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.brand.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddMobile = () => {
    setSelectedMobile(null)
    setIsDialogOpen(true)
  }

  const handleEditMobile = (mobile: AdminMobile) => {
    setSelectedMobile(mobile)
    setIsDialogOpen(true)
  }

  const handleDeleteMobile = (id: string) => {
    setMobiles(mobiles.filter((m) => m.id !== id))
  }

  const handleSaveMobile = (mobile: AdminMobile) => {
    if (selectedMobile) {
      setMobiles(mobiles.map((m) => (m.id === mobile.id ? mobile : m)))
    } else {
      setMobiles([...mobiles, { ...mobile, id: String(mobiles.length + 1) }])
    }
    setIsDialogOpen(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-700 border-green-200'
      case 'inactive':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200'
      case 'discontinued':
        return 'bg-red-500/10 text-red-700 border-red-200'
      default:
        return ''
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mobile Management</h1>
          <p className="text-muted-foreground mt-1">Manage all mobile devices in the system</p>
        </div>
        <Button onClick={handleAddMobile} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Mobile
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by model or brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Mobiles Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Mobiles ({filteredMobiles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Variants</TableHead>
                  <TableHead>Accessories</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMobiles.map((mobile) => (
                  <TableRow key={mobile.id}>
                    <TableCell>
                      <span className="font-medium">{mobile.model}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{mobile.brand}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{mobile.releaseYear}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{mobile.variants}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{mobile.accessories}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(mobile.status)}>
                        {mobile.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{mobile.createdAt}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditMobile(mobile)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteMobile(mobile.id)}
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

      {/* Mobile Dialog */}
      <MobileDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        mobile={selectedMobile}
        onSave={handleSaveMobile}
      />
    </div>
  )
}
