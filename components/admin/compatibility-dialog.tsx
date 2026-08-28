'use client'

import { useState, useEffect, useMemo } from 'react'
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
import { getBrands } from '@/lib/repository/brands'
import { upsertCompatibility } from '@/lib/repository/compatibility'
import type { CatalogCompatibility, CatalogMobile, CatalogCategory, CatalogBrand } from '@/lib/catalog-db'
import { X, Search, Loader2, ChevronRight, ChevronLeft } from 'lucide-react'
import { toast } from 'sonner'

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
  // Data State
  const [mobiles, setMobiles] = useState<CatalogMobile[]>([])
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [brands, setBrands] = useState<CatalogBrand[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Wizard State
  const [step, setStep] = useState<1 | 2>(1)
  const [isChipsExpanded, setIsChipsExpanded] = useState(false)
  const [container, setContainer] = useState<HTMLElement | null>(null)

  // Form State
  const [selectedBrandId, setSelectedBrandId] = useState('')
  const [sourceMobileId, setSourceMobileId] = useState('')
  const [category, setCategory] = useState('')
  const [compatibleMobileIds, setCompatibleMobileIds] = useState<string[]>([])
  const [targetSearch, setTargetSearch] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Track initial stage 1 values to detect changes when returning from stage 2
  const [visitedStage2, setVisitedStage2] = useState(false)
  const [lockedStage1Values, setLockedStage1Values] = useState<{ brand: string, source: string, cat: string } | null>(null)

  // Fetch initial data
  useEffect(() => {
    Promise.all([getMobiles(), getCategories(), getBrands()])
      .then(([mList, cList, bList]) => {
        setMobiles(mList)
        setCategories(cList)
        setBrands(bList)
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  // Sync state with rule when dialog opens/closes
  useEffect(() => {
    if (open) {
      setError('')
      setTargetSearch('')
      setStep(1)
      setVisitedStage2(false)
      setIsChipsExpanded(false)
      setLockedStage1Values(null)

      if (rule) {
        setSourceMobileId(rule.sourceMobileId)
        setCategory(rule.category)
        setCompatibleMobileIds(rule.compatibleMobileIds)
        
        // Find brand from source model to pre-populate brand dropdown
        const sourceMob = mobiles.find(m => m.id === rule.sourceMobileId)
        if (sourceMob) {
          setSelectedBrandId(sourceMob.brandId)
        }
      } else {
        setSelectedBrandId('')
        setSourceMobileId('')
        setCategory('')
        setCompatibleMobileIds([])
      }
    }
  }, [open, rule, mobiles])

  // Reset logic when Step 1 inputs change after having visited Step 2
  useEffect(() => {
    if (visitedStage2 && lockedStage1Values) {
      const hasChanged = 
        selectedBrandId !== lockedStage1Values.brand ||
        sourceMobileId !== lockedStage1Values.source ||
        category !== lockedStage1Values.cat

      if (hasChanged && compatibleMobileIds.length > 0) {
        setCompatibleMobileIds([])
        toast.warning('Compatible devices list has been reset due to source changes.')
      }
    }
  }, [selectedBrandId, sourceMobileId, category, visitedStage2, lockedStage1Values, compatibleMobileIds.length])


  // Filter target models by search term
  const availableTargetMobiles = useMemo(() => {
    return mobiles.filter(m => m.id !== sourceMobileId)
  }, [mobiles, sourceMobileId])

  const filteredTargetMobiles = useMemo(() => {
    const term = targetSearch.trim().toLowerCase()
    if (!term) return availableTargetMobiles
    return availableTargetMobiles.filter(m =>
      m.model.toLowerCase().includes(term) ||
      ((m as any).brandName ?? m.brandId).toLowerCase().includes(term)
    )
  }, [availableTargetMobiles, targetSearch])

  // Filter source models by selected brand
  const filteredSourceMobilesByBrand = useMemo(() => {
    if (!selectedBrandId) return []
    return mobiles.filter(m => m.brandId === selectedBrandId)
  }, [mobiles, selectedBrandId])

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

  const handleNext = () => {
    if (!selectedBrandId || !sourceMobileId || !category) {
      setError('Please fill in all fields before proceeding.')
      return
    }
    setError('')
    setLockedStage1Values({ brand: selectedBrandId, source: sourceMobileId, cat: category })
    setVisitedStage2(true)
    setStep(2)
  }

  const handleSave = async () => {
    if (compatibleMobileIds.length === 0) {
      setError('Please select at least one compatible model.')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const slugId = rule?.id || `${sourceMobileId.toLowerCase()}-${category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

      await upsertCompatibility({
        id: slugId,
        category,
        sourceMobileId,
        compatibleMobileIds,
        updatedAt: new Date().toISOString()
      })
      toast.success('Compatibility rule saved.')
      onSave()
    } catch (err) {
      console.error('Failed to save compatibility rule:', err)
      setError('Failed to save compatibility rule to the database.')
      toast.error('Failed to save rule.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        ref={setContainer} 
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {rule ? 'Edit Compatibility Rule' : 'Configure New Compatibility'} 
            <span className="text-muted-foreground ml-2 text-sm font-normal">
              (Step {step} of 2)
            </span>
          </DialogTitle>
        </DialogHeader>

        {error && <p className="text-sm text-destructive font-medium">{error}</p>}

        {step === 1 && (
          <div className="space-y-5 py-2">
            {/* Brand Selection */}
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Select 
                value={selectedBrandId} 
                onValueChange={(val) => {
                  setSelectedBrandId(val || '')
                  setSourceMobileId('') // Reset phone when brand changes
                }}
              >
                <SelectTrigger id="brand" className="w-full">
                  <SelectValue placeholder="Select a brand...">
                    {selectedBrandId ? brands.find(b => b.id === selectedBrandId)?.name : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent container={container || undefined}>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id} className="cursor-pointer">
                      {b.name}
                    </SelectItem>
                  ))}
                  {brands.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                      No brands available
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Source Phone Selection */}
            <div className="space-y-2">
              <Label htmlFor="source-model">Source Phone</Label>
              <Select 
                value={sourceMobileId} 
                onValueChange={(val) => setSourceMobileId(val || '')}
                disabled={!selectedBrandId}
              >
                <SelectTrigger id="source-model" className="w-full">
                  <SelectValue placeholder={selectedBrandId ? "Select a phone..." : "Select a brand first"}>
                    {sourceMobileId ? mobiles.find(m => m.id === sourceMobileId)?.model : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent container={container || undefined}>
                  {filteredSourceMobilesByBrand.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="cursor-pointer">
                      {m.model}
                    </SelectItem>
                  ))}
                  {filteredSourceMobilesByBrand.length === 0 && selectedBrandId && (
                    <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                      No phones found for this brand
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Accessory Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Accessory Category</Label>
              <Select value={category} onValueChange={(val) => setCategory(val || '')}>
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="Select category...">
                    {category ? categories.find(c => c.name === category)?.name || category : null}
                  </SelectValue>
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
            
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={!selectedBrandId || !sourceMobileId || !category || isLoading}
                className="gap-2"
              >
                Next Stage <ChevronRight className="w-4 h-4" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 py-2">
            <div className="space-y-3">
              <Label>Compatible Targets Selection</Label>

              {/* Selected items badges display */}
              {compatibleMobileIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-muted/30 border rounded-md min-h-[40px] items-center">
                  {compatibleMobileIds
                    .slice(0, isChipsExpanded ? undefined : 8)
                    .map((id) => {
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
                    })
                  }
                  {!isChipsExpanded && compatibleMobileIds.length > 8 && (
                    <Badge 
                      variant="outline" 
                      className="text-xs cursor-pointer hover:bg-muted"
                      onClick={() => setIsChipsExpanded(true)}
                    >
                      + {compatibleMobileIds.length - 8} more...
                    </Badge>
                  )}
                  {isChipsExpanded && compatibleMobileIds.length > 8 && (
                     <Badge 
                     variant="outline" 
                     className="text-xs cursor-pointer hover:bg-muted"
                     onClick={() => setIsChipsExpanded(false)}
                   >
                     Show less
                   </Badge>
                  )}
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
            
            <DialogFooter className="mt-6 flex justify-between w-full sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                disabled={isSaving}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
              <Button onClick={handleSave} disabled={isSaving || isLoading}>
                {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {rule ? 'Update Rule' : 'Save Rule'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
