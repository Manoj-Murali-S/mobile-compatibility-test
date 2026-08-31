'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, FileText, CheckCircle } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { downloadExcel } from '@/lib/download-utils'
import { getBrands } from '@/lib/repository/brands'
import { getMobiles } from '@/lib/repository/mobiles'
import { getCategories } from '@/lib/repository/categories'
import { getAllCompatibility } from '@/lib/repository/compatibility'

export default function ExportPage() {
  const [selectedItems, setSelectedItems] = useState({
    brands: true,
    mobiles: true,
    categories: true,
    compatibility: true,
  })
  const [isExporting, setIsExporting] = useState(false)
  const [exportedFile, setExportedFile] = useState<string | null>(null)
  const [counts, setCounts] = useState({ brands: 0, mobiles: 0, categories: 0, compatibility: 0 })

  useEffect(() => {
    async function loadCounts() {
      try {
        const [b, m, a, c] = await Promise.all([
          getBrands(),
          getMobiles(),
          getCategories(),
          getAllCompatibility(),
        ])
        setCounts({
          brands: b.length,
          mobiles: m.length,
          categories: a.length,
          compatibility: c.length,
        })
      } catch (error) {
        console.error('Failed to fetch export stats:', error)
      }
    }
    loadCounts()
  }, [])

  const toggleItem = (key: keyof typeof selectedItems) => {
    setSelectedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const sheets: Record<string, any[]> = {}

      if (selectedItems.brands) {
        const brands = await getBrands()
        sheets['Brands'] = brands.map(b => ({
          'Brand Name': b.name,
          'Created At': new Date(b.updatedAt).toLocaleString(),
        }))
      }

      const mobilesData = await getMobiles()
      const brandsData = await getBrands()
      const brandMap = new Map(brandsData.map(b => [b.id, b.name]))
      const mobileMap = new Map(mobilesData.map(m => [m.id, { model: m.model, brandId: m.brandId }]))

      if (selectedItems.mobiles) {
        sheets['Mobiles'] = mobilesData.map(m => ({
          'Model': m.model,
          'Brand': brandMap.get(m.brandId) || 'Unknown',
          'Created At': new Date(m.updatedAt).toLocaleString(),
          'Updated At': new Date(m.updatedAt).toLocaleString(),
          'Status': m.status?.toUpperCase() || 'ACTIVE',
        }))
      }
      if (selectedItems.categories) {
        const cats = await getCategories()
        sheets['Categories'] = cats.map(c => ({
          'Category Name': c.name,
          'Slug ID': c.id,
          'Created Date': new Date(c.createdAt).toLocaleString(),
          'Updated At': new Date(c.updatedAt).toLocaleString(),
        }))
      }
      if (selectedItems.compatibility) {
        const comp = await getAllCompatibility()
        sheets['Compatibility'] = comp.map(c => {
          const sourceMobile = mobileMap.get(c.sourceMobileId)
          const sourceBrandName = sourceMobile ? brandMap.get(sourceMobile.brandId) || 'Unknown' : 'Unknown'

          let compatibleDeviceNames = ''
          if (Array.isArray(c.compatibleMobileIds)) {
            compatibleDeviceNames = c.compatibleMobileIds
              .map(id => mobileMap.get(id)?.model || 'Unknown')
              .join(', ')
          }

          return {
            'Brand': sourceBrandName,
            'Mobile': sourceMobile ? sourceMobile.model : 'Unknown',
            'Category': c.category,
            'Compatible Devices Count': Array.isArray(c.compatibleMobileIds) ? c.compatibleMobileIds.length.toString() : '0',
            'Compatible Device Names': compatibleDeviceNames
          }
        })
      }
      const now = new Date()

      const date = now.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      })

      const time = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
      const name = `${date} ${time}`
      const filename = `export-${name}.xlsx`
      downloadExcel(sheets, filename)
      setExportedFile(filename)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownloadExport = () => {
    // If exportedFile is set, we can just trigger export again or it's a mock state.
    // Since XLSX.writeFile triggers the browser download automatically inside handleExport, 
    // the "Download File" button here is just a UX convenience to trigger it again.
    void handleExport()
  }

  const stats = [
    { label: 'Brands', value: counts.brands, selected: selectedItems.brands },
    { label: 'Mobiles', value: counts.mobiles, selected: selectedItems.mobiles },
    { label: 'Categories', value: counts.categories, selected: selectedItems.categories },
    { label: 'Compatibility Groups', value: counts.compatibility, selected: selectedItems.compatibility },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Export Data</h1>
        <p className="text-muted-foreground mt-1">Export your mobile and accessory data to Excel</p>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Select Items to Export</CardTitle>
          <CardDescription>Choose what data you want to include in the export</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {stats.map((item) => (
              <div key={item.label} className="flex items-center gap-4 p-4 rounded-lg border">
                <Checkbox
                  id={item.label}
                  checked={item.selected}
                  onCheckedChange={() => toggleItem(item.label.toLowerCase().replace(' ', '') as any)}
                />
                <div className="flex-1">
                  <label htmlFor={item.label} className="text-sm font-medium cursor-pointer">
                    {item.label}
                  </label>
                  <p className="text-xs text-muted-foreground">{item.value} records</p>
                </div>
                {item.selected && <Badge variant="default">Selected</Badge>}
              </div>
            ))}
          </div>

          {/* Export Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">Export Summary</p>
            <p className="text-xs text-muted-foreground">
              {Object.values(selectedItems).filter(Boolean).length} of 4 categories selected
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Total records: ~{stats.reduce((sum, s) => (s.selected ? sum + s.value : sum), 0)}
            </p>
          </div>

          <Button
            onClick={handleExport}
            disabled={!Object.values(selectedItems).some(Boolean) || isExporting}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export to Excel'}
          </Button>
        </CardContent>
      </Card>

      {/* Export Result */}
      {exportedFile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Export Successful
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-500/10 rounded-lg p-4 flex items-center gap-3">
              <FileText className="w-6 h-6 text-green-700" />
              <div>
                <p className="text-sm font-medium text-green-700">{exportedFile}</p>
                <p className="text-xs text-muted-foreground">Ready for download</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-muted-foreground">Format</p>
                <p className="font-medium">XLSX</p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-muted-foreground">Generated</p>
                <p className="font-medium">{new Date().toLocaleString()}</p>
              </div>
            </div>

            <Button onClick={handleDownloadExport} className="w-full gap-2">
              <Download className="w-4 h-4" />
              Download File
            </Button>

            <Button
              onClick={() => setExportedFile(null)}
              variant="outline"
              className="w-full"
            >
              Export Again
            </Button>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
