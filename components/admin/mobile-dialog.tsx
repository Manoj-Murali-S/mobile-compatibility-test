'use client'

import { useState, useRef, useEffect } from 'react'
import { AdminMobile } from '@/lib/admin-types'
import { fileToBase64 } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { getBrands, upsertBrand } from '@/lib/repository/brands'
import { CatalogBrand } from '@/lib/catalog-db'

interface MobileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mobile: AdminMobile | null
  onSave: (mobile: AdminMobile) => Promise<void> | void
}

export function MobileDialog({ open, onOpenChange, mobile, onSave }: MobileDialogProps) {
  const [formData, setFormData] = useState<AdminMobile>(
    mobile || {
      id: '',
      model: '',
      brand: '',
      brandId: '',
      image: '',
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    }
  )

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [brands, setBrands] = useState<CatalogBrand[]>([])
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false)
  const [container, setContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    getBrands().then(setBrands).catch(console.error)
  }, [])

  useEffect(() => {
    if (open) {
      setFormData(
        mobile || {
          id: '',
          model: '',
          brand: '',
          brandId: '',
          image: '',
          status: 'active',
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
        }
      )
    }
  }, [open, mobile])

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    try {
      await onSave({
        ...formData,
        updatedAt: new Date().toISOString().split('T')[0],
      })
      // Dialog will be closed by the parent, but we can clear saving state
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to save record.')
    } finally {
      setIsSaving(false)
    }
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
      <DialogContent
        ref={setContainer}
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="text-lg">
            {mobile ? "Edit Mobile" : "Add New Mobile"}
          </DialogTitle>
          <DialogDescription>
            {mobile
              ? "Update the mobile device details below."
              : "Add a new mobile device to your inventory."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="space-y-5 py-2">
          {/* Model */}
          <div className="space-y-2">
            <Label htmlFor="model">Model Name</Label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  model: e.target.value,
                })
              }
              placeholder="e.g. Galaxy S24 Ultra"
            />
          </div>

          {/* Brand */}
          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <div className="relative">
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => {
                  setFormData({ ...formData, brand: e.target.value })
                  setIsBrandDropdownOpen(true)
                }}
                onFocus={() => setIsBrandDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsBrandDropdownOpen(false), 200)}
                placeholder="Select or type a brand..."
                autoComplete="off"
              />
              {isBrandDropdownOpen && (
                <div className="absolute top-full mt-1 w-full max-h-60 overflow-y-auto bg-popover text-popover-foreground border rounded-md shadow-md z-50">
                  {brands.filter(b => b.name.toLowerCase().includes(formData.brand.toLowerCase())).length > 0 ? (
                    brands
                      .filter(b => b.name.toLowerCase().includes(formData.brand.toLowerCase()))
                      .map((brand) => (
                        <div 
                          key={brand.id} 
                          className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm flex items-center gap-2"
                          onMouseDown={(e) => {
                            e.preventDefault() // Prevent input blur
                            setFormData({ ...formData, brand: brand.name, brandId: brand.id })
                            setIsBrandDropdownOpen(false)
                          }}
                        >
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-xs font-semibold">
                            {brand.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{brand.name}</span>
                        </div>
                      ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No matching brands found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Image */}
          <div className="space-y-2">
            <Label htmlFor="image">Device Image</Label>

            <div className="flex items-center gap-4">
              {/* Preview */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
                {formData.image &&
                  formData.image.startsWith("data:image/") ? (
                  <img
                    src={formData.image}
                    alt="Device preview"
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">
                    No image
                  </span>
                )}
              </div>

              <div className="flex-1">
                <Input
                  id="image"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />

                <p className="mt-1.5 text-xs text-muted-foreground">
                  PNG, JPG or WEBP. Maximum size: 2MB.
                </p>
              </div>
            </div>
          </div>



          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>

            <Select
              value={formData.status}
              onValueChange={(value) => {
                if (value === 'active' || value === 'inactive' || value === 'discontinued') {
                  setFormData({
                    ...formData,
                    status: value,
                  })
                }
              }}
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>

              <SelectContent container={container || undefined}>
                <SelectItem value="active" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>Active</span>
                  </div>
                </SelectItem>

                <SelectItem value="inactive" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span>Inactive</span>
                  </div>
                </SelectItem>

                <SelectItem value="discontinued" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    <span>Discontinued</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            className="min-w-24"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : mobile ? "Update Mobile" : "Create Mobile"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
