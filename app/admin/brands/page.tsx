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
import { mockBrands, AdminBrand } from '@/lib/admin-mock-data'
import { BrandDialog } from '@/components/admin/brand-dialog'

export default function BrandsPage() {
  const [brands, setBrands] = useState<AdminBrand[]>(mockBrands)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<AdminBrand | null>(null)

  const handleAddBrand = () => {
    setSelectedBrand(null)
    setIsDialogOpen(true)
  }

  const handleEditBrand = (brand: AdminBrand) => {
    setSelectedBrand(brand)
    setIsDialogOpen(true)
  }

  const handleDeleteBrand = (id: string) => {
    setBrands(brands.filter((b) => b.id !== id))
  }

  const handleSaveBrand = (brand: AdminBrand) => {
    if (selectedBrand) {
      setBrands(brands.map((b) => (b.id === brand.id ? brand : b)))
    } else {
      setBrands([...brands, { ...brand, id: String(brands.length + 1) }])
    }
    setIsDialogOpen(false)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Brand Management</h1>
          <p className="text-muted-foreground mt-1">Manage mobile brands and their information</p>
        </div>
        <Button onClick={handleAddBrand} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Brand
        </Button>
      </div>

      {/* Brands Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Brands ({brands.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand Name</TableHead>
                  <TableHead>Devices</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{brand.logo}</span>
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
                    <TableCell className="text-sm text-muted-foreground">{brand.createdAt}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{brand.updatedAt}</TableCell>
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
                  </TableRow>
                ))}
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
