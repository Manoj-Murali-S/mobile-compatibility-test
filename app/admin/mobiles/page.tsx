'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Plus, MoreHorizontal, Pencil, Trash2, Search, Loader2, Power } from 'lucide-react'
import { MobileDialog } from '@/components/admin/mobile-dialog'
import { getMobiles, upsertMobile, deleteMobile } from '@/lib/repository/mobiles'
import { getBrands, upsertBrand } from '@/lib/repository/brands'
import { useAuth } from '@/lib/auth'
import type { AdminMobile } from '@/lib/admin-types'
import type { CatalogMobile } from '@/lib/catalog-db'

function toAdminMobile(m: CatalogMobile): AdminMobile {
  return {
    id: m.id,
    model: m.model,
    brand: (m as any).brandName ?? m.brandId,
    brandId: m.brandId,
    image: m.image,
    status: (m as any).status ?? 'active',
    createdAt: (m as any).createdAt ?? new Date().toLocaleDateString(),
    updatedAt: new Date(m.updatedAt).toLocaleDateString(),
  }
}

export default function MobilesPage() {
  const { user } = useAuth()
  const isViewer = user?.role === 'viewer'
  const [mobiles, setMobiles] = useState<AdminMobile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedMobile, setSelectedMobile] = useState<AdminMobile | null>(null)

  const filteredMobiles = mobiles.filter(
    (m) =>
      m.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.brand.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const loadMobiles = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getMobiles()
      setMobiles(data.map(toAdminMobile))
    } catch (err) {
      console.error('Failed to load mobiles', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { void loadMobiles() }, [loadMobiles])

  const handleAddMobile = () => {
    setSelectedMobile(null)
    setIsDialogOpen(true)
  }

  const handleEditMobile = (mobile: AdminMobile) => {
    setSelectedMobile(mobile)
    setIsDialogOpen(true)
  }

  const handleDeleteMobile = async (id: string) => {
    await deleteMobile(id)
    await loadMobiles()
  }

  const handleSaveMobile = async (mobile: AdminMobile) => {
    let finalBrandId = mobile.brandId

    // Resolve matching brand name
    const allBrands = await getBrands()
    const matchedBrand = allBrands.find(b => b.name.toLowerCase() === mobile.brand.trim().toLowerCase())
    if (matchedBrand) {
      finalBrandId = matchedBrand.id
    } else if (mobile.brand.trim()) {
      // Create brand dynamically if typed custom brand does not exist
      const newBrandId = crypto.randomUUID()
      await upsertBrand({
        id: newBrandId,
        name: mobile.brand.trim(),
        status: 'active'
      } as any)
      finalBrandId = newBrandId
    }

    await upsertMobile({
      id: mobile.id || crypto.randomUUID(),
      brandId: finalBrandId,
      model: mobile.model,
      image: mobile.image,
      status: mobile.status,
      updatedAt: new Date().toISOString(),
    } as any)
    setIsDialogOpen(false)
    await loadMobiles()
  }

  const handleToggleStatus = async (mobile: AdminMobile) => {
    const newStatus = mobile.status === 'active' ? 'inactive' : 'active'
    await upsertMobile({
      id: mobile.id,
      brandId: mobile.brandId,
      model: mobile.model,
      image: mobile.image,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    } as any)
    await loadMobiles()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-700 border-green-200'
      case 'inactive': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200'
      case 'discontinued': return 'bg-red-500/10 text-red-700 border-red-200'
      default: return ''
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mobile Devices</h1>
          <p className="text-muted-foreground mt-1">Manage mobile models, variants, and specifications</p>
        </div>
        {!isViewer && (
          <Button onClick={handleAddMobile} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Device
          </Button>
        )}
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
          <CardTitle className="text-base">
            All Mobiles ({filteredMobiles.length})
            {isLoading && <Loader2 className="inline-block ml-2 w-4 h-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  {!isViewer && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMobiles.map((mobile) => (
                  <TableRow key={mobile.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {mobile.image && mobile.image.startsWith('data:image/') && (
                          <img src={mobile.image} alt={mobile.model} className="w-8 h-8 object-contain bg-white rounded border p-1" />
                        )}
                        <span className="font-medium">{mobile.model}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{mobile.brand}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(mobile.status)}>
                        {mobile.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{mobile.updatedAt}</TableCell>
                    {!isViewer && (
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
                            <DropdownMenuItem onClick={() => handleToggleStatus(mobile)}>
                              <Power className="w-4 h-4 mr-2" />
                              {mobile.status === 'active' ? 'Mark Inactive' : 'Mark Active'}
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
                    )}
                  </TableRow>
                ))}
                {!isLoading && filteredMobiles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      {searchTerm ? 'No results matching your search.' : 'No mobiles yet. Click "Add Mobile" to create one.'}
                    </TableCell>
                  </TableRow>
                )}
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
