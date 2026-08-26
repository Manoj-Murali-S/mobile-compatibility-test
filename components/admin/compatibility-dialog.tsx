'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getMobiles } from '@/lib/repository/mobiles'
import { getCategories } from '@/lib/repository/categories'
import { upsertCompatibility } from '@/lib/repository/compatibility'
import type { CatalogCompatibility, CatalogMobile, CatalogCategory } from '@/lib/catalog-db'
import { X, Search, Loader2 } from 'lucide-react'

interface CompatibilityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rule: CatalogCompatibility | null
  onSave: () => void
}

export function CompatibilityDialog({
  open,
  onOpenChange,
  rule,
  onSave,
}: CompatibilityDialogProps) {
  const [mobiles, setMobiles] = useState<CatalogMobile[]>([])
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Form State
  const [sourceMobileId, setSourceMobileId] = useState('')
  const [sourceSearch, setSourceSearch] = useState('')
  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false)
  const [category, setCategory] = useState('')
  const [compatibleMobileIds, setCompatibleMobileIds] = useState<string[]>([])
  const [targetSearch, setTargetSearch] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [container, setContainer] = useState<HTMLElement | null>(null)

  // Fetch initial mobiles and categories
  useEffect(() => {
    Promise.all([getMobiles(), getCategories()])
      .then(([mList, cList]) => {
        setMobiles(mList)
        setCategories(cList)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  // Sync state with rule when dialog opens/closes
  useEffect(() => {
    if (open) {
      setError('')
      setTargetSearch('')
      if (rule) {
        setSourceMobileId(rule.sourceMobileId)
        setCategory(rule.category)
        setCompatibleMobileIds(rule.compatibleMobileIds)
        
        // Find mobile brand + model for text input display
        const sourceMob = mobiles.find(m => m.id === rule.sourceMobileId)
        setSourceSearch(sourceMob ? `${(sourceMob as any).brandName ?? sourceMob.brandId} ${sourceMob.model}` : rule.sourceMobileId)
      } else {
        setSourceMobileId('')
        setSourceSearch('')
        setCategory('')
        setCompatibleMobileIds([])
      }
    }
  }, [open, rule, mobiles])

  // Filter out source model from target choices
  const availableTargetMobiles = useMemo(() => {
    return mobiles.filter(m => m.id !== sourceMobileId)
  }, [mobiles, sourceMobileId])

  // Filter target models by search term
  const filteredTargetMobiles = useMemo(() => {
    const term = targetSearch.trim().toLowerCase()
    if (!term) return availableTargetMobiles
    return availableTargetMobiles.filter(m =>
      m.model.toLowerCase().includes(term) ||
      ((m as any).brandName ?? m.brandId).toLowerCase().includes(term)
    )
  }, [availableTargetMobiles, targetSearch])

  // Filter source models list for search dropdown
  const filteredSourceMobiles = useMemo(() => {
    const term = sourceSearch.trim().toLowerCase()
    if (!term) return mobiles
    return mobiles.filter(m =>
      m.model.toLowerCase().includes(term) ||
      ((m as any).brandName ?? m.brandId).toLowerCase().includes(term)
    )
  }, [mobiles, sourceSearch])

  const handleToggleTargetDevice = (mobileId: string) => {
    setCompatibleMobileIds(prev =>
      prev.includes(mobileId)
        ? prev.filter(id => id !== mobileId)
        : [...prev, mobileId]
    )
  }

  const handleRemoveTargetDevice = (mobileId: string) => {
    setCompatibleMobileIds(prev => prev.filter(id => id !== mobileId))
  }

  const handleSave = async () => {
    if (!sourceMobileId) {
      setError('Please select a Source Model phone.')
      return
    }
    if (!category) {
      setError('Please select an Accessory Category.')
      return
    }
    if (compatibleMobileIds.length === 0) {
      setError('Please select at least one compatible model.')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      // Deterministic ID based on source mobile ID + category slug
      const slugId = rule?.id || `${sourceMobileId.toLowerCase()}-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

      await upsertCompatibility({
        id: slugId,
        category,
        sourceMobileId,
        compatibleMobileIds,
        updatedAt: new Date().toISOString()
      })
      onSave()
    } catch (err) {
      console.error('Failed to save compatibility rule:', err)
      setError('Failed to save compatibility rule to the database.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        ref={setContainer} 
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>{rule ? 'Edit Compatibility Rule' : 'Configure New Compatibility'}</DialogTitle>
        </DialogHeader>

        {error && <p className="text-sm text-destructive font-medium">{error}</p>}

        <div className="space-y-5 py-2">
          {/* Source Model Combobox */}
          <div className="space-y-2">
            <Label htmlFor="source-model">Source Model Phone</Label>
            <div className="relative">
              <Input
                id="source-model"
                value={sourceSearch}
                onChange={(e) => {
                  setSourceSearch(e.target.value)
                  setIsSourceDropdownOpen(true)
                }}
                onFocus={() => setIsSourceDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsSourceDropdownOpen(false), 200)}
                placeholder="Search source phone..."
                autoComplete="off"
              />
              {isSourceDropdownOpen && mobiles.length > 0 && (
                <div className="absolute top-full mt-1 w-full max-h-48 overflow-y-auto bg-popover text-popover-foreground border rounded-md shadow-md z-50">
                  {filteredSourceMobiles.length > 0 ? (
                    filteredSourceMobiles.map((m) => (
                      <div
                        key={m.id}
                        className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm flex items-center justify-between"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          setSourceMobileId(m.id)
                          setSourceSearch(`${(m as any).brandName ?? m.brandId} ${m.model}`)
                          setIsSourceDropdownOpen(false)
                          // Clear incompatibilities involving this phone if it shifted
                          setCompatibleMobileIds(prev => prev.filter(id => id !== m.id))
                        }}
                      >
                        <span className="font-medium">{m.model}</span>
                        <span className="text-xs text-muted-foreground">{(m as any).brandName ?? m.brandId}</span>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No matching models found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Accessory Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Accessory Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent container={container || undefined}>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.name} className="cursor-pointer">
                    {c.name}
                  </SelectItem>
                ))}
                {categories.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                    No categories found
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Compatible Targets Checklist */}
          <div className="space-y-3">
            <Label>Compatible Models</Label>

            {/* Selected items badges display */}
            {compatibleMobileIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-muted/30 border rounded-md min-h-[40px] items-center">
                {compatibleMobileIds.map((id) => {
                  const mob = mobiles.find(m => m.id === id)
                  const displayName = mob ? `${(mob as any).brandName ?? mob.brandId} ${mob.model}` : id
                  return (
                    <Badge key={id} variant="secondary" className="text-xs flex items-center gap-1">
                      {displayName}
                      <button
                        type="button"
                        onClick={() => handleRemoveTargetDevice(id)}
                        className="hover:text-destructive rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            )}

            {/* Devices Search and Scrollable Checklist */}
            <div className="border rounded-md p-3 space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={targetSearch}
                  onChange={(e) => setTargetSearch(e.target.value)}
                  placeholder="Search devices to link..."
                  className="pl-9 h-9"
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {filteredTargetMobiles.length > 0 ? (
                  filteredTargetMobiles.map((m) => {
                    const isChecked = compatibleMobileIds.includes(m.id)
                    return (
                      <div
                        key={m.id}
                        onClick={() => handleToggleTargetDevice(m.id)}
                        className="flex items-center space-x-2 p-1.5 hover:bg-accent/40 rounded-md cursor-pointer select-none text-sm"
                      >
                        <Checkbox
                          id={`target-${m.id}`}
                          checked={isChecked}
                          onCheckedChange={() => {}} // Row click handles it
                        />
                        <div className="flex justify-between w-full items-center">
                          <span className="font-medium">{m.model}</span>
                          <span className="text-xs text-muted-foreground">{(m as any).brandName ?? m.brandId}</span>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {mobiles.length === 0 ? 'No mobile devices available. Create some first.' : 'No matching models found.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {rule ? 'Update Rule' : 'Save Rule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
