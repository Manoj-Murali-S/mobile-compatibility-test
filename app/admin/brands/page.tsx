'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Plus, MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react'
import { BrandDialog } from '@/components/admin/brand-dialog'
import { getBrands, upsertBrand, deleteBrand } from '@/lib/repository/brands'
import type { AdminBrand } from '@/lib/admin-mock-data'
import type { CatalogBrand } from '@/lib/catalog-db'
import { useAuth } from '@/lib/auth'

// Map CatalogBrand to AdminBrand shape expected by the dialog
function toAdminBrand(b: CatalogBrand): AdminBrand {
  return {
    id: b.id,
    name: b.name,
    logo: b.logo ?? '📱',
    deviceCount: (b as any).deviceCount ?? 0,
    status: (b as any).status ?? 'active',
    createdAt: (b as any).createdAt ?? new Date().toLocaleDateString(),
    updatedAt: new Date(b.updatedAt).toLocaleDateString(),
  }
}

export default function BrandsPage() {
  const { user } = useAuth()
  const isViewer = user?.role === 'viewer'
  const [brands, setBrands] = useState<AdminBrand[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<AdminBrand | null>(null)

  const loadBrands = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getBrands()
      setBrands(data.map(toAdminBrand))
    } catch (err) {
      console.error('Failed to load brands', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { void loadBrands() }, [loadBrands])

  const handleAddBrand = () => {
    setSelectedBrand(null)
    setIsDialogOpen(true)
  }

  const handleEditBrand = (brand: AdminBrand) => {
    setSelectedBrand(brand)
    setIsDialogOpen(true)
  }

  const handleDeleteBrand = async (id: string) => {
    await deleteBrand(id)
    await loadBrands()
  }

  const handleSaveBrand = async (brand: AdminBrand) => {
    await upsertBrand({
      id: brand.id || brand.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: brand.name,
      logo: brand.logo,
      updatedAt: new Date().toISOString(),
    })
    setIsDialogOpen(false)
    await loadBrands()
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Brand Management</h1>
          <p className="text-muted-foreground mt-1">Manage mobile brands and their information</p>
        </div>
        {!isViewer && (
          <Button onClick={handleAddBrand} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Brand
          </Button>
        )}
      </div>

      {/* Brands Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            All Brands ({brands.length})
            {isLoading && <Loader2 className="inline-block ml-2 w-4 h-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand Name</TableHead>
                  <TableHead>Devices</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  {!isViewer && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {brand.logo && brand.logo.startsWith('data:image/') ? (
                          <img src={brand.logo} alt={brand.name} className="w-8 h-8 object-contain bg-white rounded border p-1" />
                        ) : (
                          <span className="text-2xl">{brand.logo}</span>
                        )}
                        <span className="font-medium">{brand.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{brand.deviceCount}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={brand.status === 'active' ? 'default' : 'secondary'}
                        className={
                          brand.status === 'active'
                            ? 'bg-green-500/10 text-green-700 border-green-200'
                            : ''
                        }
                      >
                        {brand.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{brand.updatedAt}</TableCell>
                    {!isViewer && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditBrand(brand)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteBrand(brand.id)}
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
                {!isLoading && brands.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No brands yet. Click &quot;Add Brand&quot; to create one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Brand Dialog */}
      <BrandDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        brand={selectedBrand}
        onSave={handleSaveBrand}
      />
    </div>
  )
}
