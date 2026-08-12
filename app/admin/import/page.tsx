'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, CheckCircle, AlertCircle, File, Download } from 'lucide-react'
import { downloadImportTemplate } from '@/lib/download-utils'

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: number
    failed: number
    warnings: number
  } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setImportResult(null)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setIsImporting(true)
    // Simulate import process
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setImportResult({
      success: 45,
      failed: 2,
      warnings: 3,
    })
    setIsImporting(false)
    setFile(null)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Import Data</h1>
        <p className="text-muted-foreground mt-1">Import mobile and accessory data from Excel files</p>
      </div>

      {/* Import Card */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Excel File</CardTitle>
          <CardDescription>
            Supported formats: XLSX, XLS. Maximum file size: 10 MB
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Input */}
          <div className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-colors"
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Drag & drop or click to select</p>
            <p className="text-xs text-muted-foreground mt-1">XLSX, XLS files up to 10 MB</p>
            <input
              id="file-input"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Selected File */}
          {file && (
            <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <File className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFile(null)}
              >
                Remove
              </Button>
            </div>
          )}

          {/* Import Button */}
          <Button
            onClick={handleImport}
            disabled={!file || isImporting}
            className="w-full"
          >
            {isImporting ? 'Importing...' : 'Import Data'}
          </Button>
        </CardContent>
      </Card>

      {/* Import Result */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Import Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-500/10 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-700">{importResult.success}</p>
                  <p className="text-xs text-muted-foreground mt-1">Successfully Imported</p>
                </div>
                <div className="bg-yellow-500/10 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-700">{importResult.warnings}</p>
                  <p className="text-xs text-muted-foreground mt-1">Warnings</p>
                </div>
                <div className="bg-red-500/10 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-700">{importResult.failed}</p>
                  <p className="text-xs text-muted-foreground mt-1">Failed</p>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Duplicate entries detected</p>
                    <p className="text-xs text-muted-foreground">
                      3 duplicate mobile entries were skipped during import
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={() => setImportResult(null)} variant="outline" className="w-full">
                Import Another File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Import Template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Download our Excel template to ensure your data is formatted correctly
          </p>
          <Button variant="outline" onClick={downloadImportTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>

          <div className="bg-blue-500/10 rounded-lg p-4 text-sm">
            <p className="font-medium text-blue-700 mb-2">Required Columns:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Model Name</li>
              <li>• Brand</li>
              <li>• Release Year</li>
              <li>• Variants</li>
              <li>• Status (active/inactive)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
