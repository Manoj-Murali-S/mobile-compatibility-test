'use client'

import { useState, useRef } from 'react'
import { AdminBrand } from '@/lib/admin-mock-data'
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

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  const handleSave = () => {
    onSave(formData)
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
      setFormData({ ...formData, logo: base64 })
    } catch (err: any) {
      setError('Failed to read file')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{brand ? 'Edit Brand' : 'Add New Brand'}</DialogTitle>
        </DialogHeader>
        
        {error && <p className="text-sm text-destructive">{error}</p>}

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
            <Label htmlFor="logo">Brand Logo (Image)</Label>
            <div className="flex items-center gap-4 mt-1">
              {formData.logo && formData.logo.startsWith('data:image/') ? (
                <img src={formData.logo} alt="Logo preview" className="w-12 h-12 object-contain bg-white rounded border p-1" />
              ) : formData.logo ? (
                <span className="text-2xl">{formData.logo}</span>
              ) : null}
              <Input
                id="logo"
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
