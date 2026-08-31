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
import { Plus, MoreHorizontal, Pencil, Trash2, Loader2, Power } from 'lucide-react'
import { BrandDialog } from '@/components/admin/brand-dialog'
import { getBrands, upsertBrand, deleteBrand } from '@/lib/repository/brands'
import type { AdminBrand } from '@/lib/admin-types'
import type { CatalogBrand } from '@/lib/catalog-db'
import { useAuth } from '@/lib/auth'

// Map CatalogBrand to AdminBrand shape expected by the dialog
function toAdminBrand(b: CatalogBrand): AdminBrand {
  return {
    id: b.id,
    name: b.name,
    logo: b.logo ?? '📱',
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
      const sorted = data.sort((a, b) => a.name.localeCompare(b.name))
      setBrands(sorted.map(toAdminBrand))
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
      id: brand.id || crypto.randomUUID(),
      name: brand.name,
      logo: brand.logo,
      status: brand.status,
      updatedAt: new Date().toISOString(),
    } as any)
    setIsDialogOpen(false)
    await loadBrands()
  }

  const handleToggleStatus = async (brand: AdminBrand) => {
    const newStatus = brand.status === 'active' ? 'inactive' : 'active'
    await upsertBrand({
      id: brand.id,
      name: brand.name,
      logo: brand.logo,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    } as any)
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
                          <img
                            src={brand.logo}
                            alt={brand.name}
                            className="w-8 h-8 object-contain bg-white rounded border p-1"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-sm font-semibold text-foreground">
                            {brand.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium capitalize">{brand.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={brand.status === 'active' ? 'default' : 'destructive'}
                        className={
                          `rounded ${brand.status === 'active'
                            ? 'bg-green-500/10 text-green-700 border-green-200 w-20'
                            : 'w-20'}`
                        }
                      >
                        {brand.status?.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{brand.updatedAt}</TableCell>
                    {!isViewer && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
                            <MoreHorizontal className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditBrand(brand)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(brand)}>
                              <Power className="w-4 h-4 mr-2" />
                              {brand.status === 'active' ? 'Mark Inactive' : 'Mark Active'}
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
