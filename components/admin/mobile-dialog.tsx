'use client'

import { useState, useRef } from 'react'
import { AdminMobile } from '@/lib/admin-mock-data'
import { fileToBase64 } from '@/lib/utils'
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
      image: '',
      releaseYear: new Date().getFullYear(),
      variants: 1,
      accessories: 0,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    }
  )

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  const handleSave = () => {
    onSave({
      ...formData,
      updatedAt: new Date().toISOString().split('T')[0],
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    try {
      const base64 = await fileToBase64(file)
      setFormData({ ...formData, image: base64 })
    } catch (err: any) {
      setError('Failed to read file')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mobile ? 'Edit Mobile' : 'Add New Mobile'}</DialogTitle>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

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
            <Label htmlFor="image">Device Image</Label>
            <div className="flex items-center gap-4 mt-1">
              {formData.image && formData.image.startsWith('data:image/') && (
                <img src={formData.image} alt="Device preview" className="w-12 h-12 object-contain bg-white rounded border p-1" />
              )}
              <Input
                id="image"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Max size: 2MB.</p>
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
