'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Plus, MoreHorizontal, Pencil, Trash2, Loader2, Settings, Tag } from 'lucide-react'
import { CompatibilityDialog } from '@/components/admin/compatibility-dialog'
import { getAllCompatibility, deleteCompatibility } from '@/lib/repository/compatibility'
import { getCategories, upsertCategory, deleteCategory } from '@/lib/repository/categories'
import { getMobiles } from '@/lib/repository/mobiles'
import type { CatalogCompatibility, CatalogCategory, CatalogMobile } from '@/lib/catalog-db'
import { useMemo } from 'react'
import { useAuth } from '@/lib/auth'

export default function CompatibilityPage() {
  const [activeTab, setActiveTab] = useState<'rules' | 'categories'>('rules')
  const [rules, setRules] = useState<CatalogCompatibility[]>([])
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [mobiles, setMobiles] = useState<CatalogMobile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<CatalogCompatibility | null>(null)
  const { user } = useAuth()
  const isViewer = user?.role === 'viewer'

  // Category Form State
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isSavingCategory, setIsSavingCategory] = useState(false)

  // Memoized map from mobile.id to "Brand Model"
  const mobileMap = useMemo(() => {
    return new Map(mobiles.map(m => [m.id, `${(m as any).brandName ?? m.brandId} ${m.model}`]))
  }, [mobiles])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [rData, cData, mData] = await Promise.all([
        getAllCompatibility(),
        getCategories(),
        getMobiles()
      ])
      setRules(rData)
      setCategories(cData)
      setMobiles(mData)
    } catch (err) {
      console.error('Failed to load compatibility data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAddRule = () => {
    setSelectedRule(null)
    setIsDialogOpen(true)
  }

  const handleEditRule = (rule: CatalogCompatibility) => {
    setSelectedRule(rule)
    setIsDialogOpen(true)
  }

  const handleDeleteRule = async (id: string) => {
    if (confirm('Are you sure you want to delete this compatibility rule?')) {
      await deleteCompatibility(id)
      await loadData()
    }
  }

  const handleSaveRule = async () => {
    setIsDialogOpen(false)
    await loadData()
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = newCategoryName.trim()
    if (!name) return

    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    if (categories.some(c => c.id === id)) {
      alert('A category with this name or slug already exists.')
      return
    }

    setIsSavingCategory(true)
    try {
      await upsertCategory({
        id,
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      setNewCategoryName('')
      await loadData()
    } catch (err) {
      console.error('Failed to add category:', err)
    } finally {
      setIsSavingCategory(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    const isDefault = ['tempered-glass', 'back-case', 'silicone-cover', 'flip-cover', 'camera-protector'].includes(id)
    const confirmMsg = isDefault 
      ? 'This is a system default category. Deleting it may impact searches unless recreated. Are you sure?'
      : 'Are you sure you want to delete this category?'

    if (confirm(confirmMsg)) {
      await deleteCategory(id)
      await loadData()
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Compatibility Management</h1>
          <p className="text-muted-foreground mt-1">
            Map shared accessories and manage accessory categories
          </p>
        </div>
        {activeTab === 'rules' && !isViewer && (
          <Button onClick={handleAddRule} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Rule
          </Button>
        )}
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'rules'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Settings className="w-4 h-4" />
          Compatibility Rules
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'categories'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Tag className="w-4 h-4" />
          Categories
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : activeTab === 'rules' ? (
        /* TAB 1: Compatibility Rules Table */
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Rules ({rules.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source Model</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Compatible Models</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-semibold">
                        {mobileMap.get(rule.sourceMobileId) || rule.sourceMobileId}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{rule.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5 max-w-xl">
                          {rule.compatibleMobileIds.map((id) => (
                            <Badge key={id} variant="secondary" className="text-xs">
                              {mobileMap.get(id) || id}
                            </Badge>
                          ))}
                          {rule.compatibleMobileIds.length === 0 && (
                            <span className="text-xs text-muted-foreground">None configured</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
                            <MoreHorizontal className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditRule(rule)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteRule(rule.id)}
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
                  {rules.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No compatibility rules configured yet. Click "Add Rule" to configure one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* TAB 2: Categories Management */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add Category Card */}
          {!isViewer && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add Category</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddCategory} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="category-name">Category Name</Label>
                    <Input
                      id="category-name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g. Camera Film"
                      disabled={isSavingCategory}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSavingCategory || !newCategoryName.trim()}>
                    {isSavingCategory ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    Create Category
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Categories List Card */}
          <Card className={!isViewer ? "md:col-span-2" : "md:col-span-3"}>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Available Categories ({categories.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category Name</TableHead>
                    <TableHead>Slug / Slugified ID</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-semibold">{category.name}</TableCell>
                      <TableCell className="text-xs text-mono text-muted-foreground">{category.id}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {categories.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                        No categories found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Compatibility Dialog */}
      <CompatibilityDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        rule={selectedRule}
        onSave={handleSaveRule}
      />
    </div>
  )
}
