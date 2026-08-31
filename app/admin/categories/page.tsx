'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { getCategories, upsertCategory, deleteCategory } from '@/lib/repository/categories'
import type { CatalogCategory } from '@/lib/catalog-db'
import { useAuth } from '@/lib/auth'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const isViewer = user?.role === 'viewer'

  // Category Form State
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isSavingCategory, setIsSavingCategory] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const cData = await getCategories()
      const sorted = cData.sort((a, b) => a.name.localeCompare(b.name))
      setCategories(sorted)
    } catch (err) {
      console.error('Failed to load categories data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

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
          <h1 className="text-3xl font-bold">Categories Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage accessory categories
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
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
                    <TableHead>Slug ID</TableHead>
                    {!isViewer && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-semibold capitalize">{category.name}</TableCell>
                      <TableCell className="text-xs text-mono text-muted-foreground">{category.id}</TableCell>
                      {!isViewer && (
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
                      )}
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
    </div>
  )
}
