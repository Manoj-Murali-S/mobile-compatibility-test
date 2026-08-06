'use client'

import { useState } from 'react'
import { AdminBrand } from '@/lib/admin-mock-data'
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

interface BrandDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  brand: AdminBrand | null
  onSave: (brand: AdminBrand) => void
}

export function BrandDialog({ open, onOpenChange, brand, onSave }: BrandDialogProps) {
  const [formData, setFormData] = useState<AdminBrand>(
    brand || {
      id: '',
      name: '',
      logo: '📱',
      deviceCount: 0,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    }
  )

  const handleSave = () => {
    onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{brand ? 'Edit Brand' : 'Add New Brand'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Brand Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Samsung"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="logo">Logo Emoji</Label>
            <Input
              id="logo"
              value={formData.logo}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
              placeholder="📱"
              className="mt-1"
              maxLength={2}
            />
          </div>

          <div>
            <Label htmlFor="deviceCount">Device Count</Label>
            <Input
              id="deviceCount"
              type="number"
              value={formData.deviceCount}
              onChange={(e) => setFormData({ ...formData, deviceCount: parseInt(e.target.value) })}
              placeholder="0"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => 
              setFormData({ ...formData, status: value })
            }>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{brand ? 'Update' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
