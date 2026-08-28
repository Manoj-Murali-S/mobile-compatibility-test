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
import { getMobiles } from '@/lib/repository/mobiles'
import type { CatalogCompatibility, CatalogMobile } from '@/lib/catalog-db'
import { useMemo } from 'react'
import { useAuth } from '@/lib/auth'

export default function CompatibilityPage() {
  const [rules, setRules] = useState<CatalogCompatibility[]>([])
  const [mobiles, setMobiles] = useState<CatalogMobile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<CatalogCompatibility | null>(null)
  const { user } = useAuth()
  const isViewer = user?.role === 'viewer'


  // Memoized map from mobile.id to "Brand Model"
  const mobileMap = useMemo(() => {
    return new Map(mobiles.map(m => [m.id, `${(m as any).brandName ?? m.brandId} ${m.model}`]))
  }, [mobiles])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [rData, mData] = await Promise.all([
        getAllCompatibility(),
        getMobiles()
      ])
      setRules(rData)
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
        {!isViewer && (
          <Button onClick={handleAddRule} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Rule
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        /* Compatibility Rules Table */
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
                    {!isViewer && <TableHead className="text-right">Actions</TableHead>}
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
                      {!isViewer && (
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
                      )}
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
