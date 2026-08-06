'use client'

import { useState } from 'react'
import { AdminMobile } from '@/lib/admin-mock-data'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { mockBrands } from '@/lib/admin-mock-data'

interface MobileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mobile: AdminMobile | null
  onSave: (mobile: AdminMobile) => void
}

export function MobileDialog({ open, onOpenChange, mobile, onSave }: MobileDialogProps) {
  const [formData, setFormData] = useState<AdminMobile>(
    mobile || {
      id: '',
      model: '',
      brand: 'Samsung',
      releaseYear: new Date().getFullYear(),
      variants: 1,
      accessories: 0,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    }
  )

  const handleSave = () => {
    onSave({
      ...formData,
      updatedAt: new Date().toISOString().split('T')[0],
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mobile ? 'Edit Mobile' : 'Add New Mobile'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="model">Model Name</Label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="e.g., Galaxy S24 Ultra"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="brand">Brand</Label>
            <Select value={formData.brand} onValueChange={(value) =>
              setFormData({ ...formData, brand: value })
            }>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mockBrands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.name}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="year">Release Year</Label>
            <Input
              id="year"
              type="number"
              value={formData.releaseYear}
              onChange={(e) =>
                setFormData({ ...formData, releaseYear: parseInt(e.target.value) })
              }
              placeholder="2024"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="variants">Variants</Label>
            <Input
              id="variants"
              type="number"
              value={formData.variants}
              onChange={(e) => setFormData({ ...formData, variants: parseInt(e.target.value) })}
              placeholder="1"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="accessories">Accessories</Label>
            <Input
              id="accessories"
              type="number"
              value={formData.accessories}
              onChange={(e) =>
                setFormData({ ...formData, accessories: parseInt(e.target.value) })
              }
              placeholder="0"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: 'active' | 'inactive' | 'discontinued') => 
              setFormData({ ...formData, status: value })
            }>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="discontinued">Discontinued</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{mobile ? 'Update' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
