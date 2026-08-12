'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, FileText, CheckCircle } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { downloadCsv } from '@/lib/download-utils'
import { exportCatalogSnapshot } from '@/lib/catalog-db'

export default function ExportPage() {
  const [selectedItems, setSelectedItems] = useState({
    brands: true,
    mobiles: true,
    accessories: true,
    compatibility: true,
  })
  const [isExporting, setIsExporting] = useState(false)
  const [exportedFile, setExportedFile] = useState<string | null>(null)

  const toggleItem = (key: keyof typeof selectedItems) => {
    setSelectedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleExport = async () => {
    setIsExporting(true)
    const snapshot = await exportCatalogSnapshot()
    const rows = selectedItems.mobiles
      ? snapshot.mobiles
      : selectedItems.brands
        ? snapshot.brands
        : snapshot.accessories
    downloadCsv(rows as Record<string, unknown>[], `mobile-catalog-${new Date().toISOString().slice(0, 10)}.csv`)
    setExportedFile(`mobile-catalog-${new Date().toISOString().slice(0, 10)}.csv`)
    setIsExporting(false)
  }

  const handleDownloadExport = () => {
    void handleExport()
  }

  const stats = [
    { label: 'Brands', value: 6, selected: selectedItems.brands },
    { label: 'Mobiles', value: 184, selected: selectedItems.mobiles },
    { label: 'Accessories', value: 456, selected: selectedItems.accessories },
    { label: 'Compatibility Groups', value: 5, selected: selectedItems.compatibility },
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

      {/* Export History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Exports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              'export_2024-08-06.xlsx',
              'export_2024-08-05.xlsx',
              'export_2024-08-01.xlsx',
            ].map((file, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{file}</span>
                </div>
                <Button variant="ghost" size="sm">
                  Download
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
