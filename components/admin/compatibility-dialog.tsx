'use client'

import { useState } from 'react'
import { CompatibilityGroup } from '@/lib/admin-mock-data'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CompatibilityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: CompatibilityGroup | null
  onSave: (group: CompatibilityGroup) => void
}

export function CompatibilityDialog({
  open,
  onOpenChange,
  group,
  onSave,
}: CompatibilityDialogProps) {
  const [formData, setFormData] = useState<CompatibilityGroup>(
    group || {
      id: '',
      name: '',
      description: '',
      devices: 0,
      accessories: 0,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
    }
  )

  const handleSave = () => {
    onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{group ? 'Edit Group' : 'Add New Group'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Flagship 2024"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe this compatibility group..."
              className="mt-1 resize-none"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="devices">Devices Count</Label>
            <Input
              id="devices"
              type="number"
              value={formData.devices}
              onChange={(e) => setFormData({ ...formData, devices: parseInt(e.target.value) })}
              placeholder="0"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="accessories">Accessories Count</Label>
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
          <Button onClick={handleSave}>{group ? 'Update' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
