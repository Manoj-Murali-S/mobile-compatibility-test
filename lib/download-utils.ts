export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadText(content: string, filename: string, type = 'text/plain;charset=utf-8') {
  downloadBlob(new Blob([content], { type }), filename)
}

export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return ''
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
  const escape = (value: unknown) => {
    const text = Array.isArray(value) ? value.join('; ') : String(value ?? '')
    return `"${text.replace(/"/g, '""')}"`
  }
  return [columns.map(escape).join(','), ...rows.map((row) => columns.map((column) => escape(row[column])).join(','))].join('\n')
}

export function downloadJson(data: unknown, filename: string) {
  downloadText(JSON.stringify(data, null, 2), filename, 'application/json')
}

export function downloadCsv(rows: Record<string, unknown>[], filename: string) {
  downloadText(`\ufeff${toCsv(rows)}`, filename, 'text/csv;charset=utf-8')
}

import * as XLSX from 'xlsx'

export function downloadImportTemplate() {
  downloadCsv([
    { model_name: 'Galaxy S24', brand: 'Samsung', status: 'active' },
  ], 'mobile-catalog-import-template.csv')
}

export function downloadExcel(sheets: Record<string, Record<string, unknown>[]>, filename: string) {
  const wb = XLSX.utils.book_new()
  for (const [sheetName, data] of Object.entries(sheets)) {
    let ws: XLSX.WorkSheet
    if (data && data.length > 0) {
      ws = XLSX.utils.json_to_sheet(data)
      
      // Auto-fit column widths based on headers and first few rows
      const objectKeys = Object.keys(data[0])
      const colWidths = objectKeys.map(key => {
        let maxLen = key.length
        for (let i = 0; i < Math.min(data.length, 50); i++) {
          const val = String(data[i][key] || '')
          if (val.length > maxLen) maxLen = val.length
        }
        return { wch: Math.min(maxLen + 2, 50) } // Cap max width at 50 chars
      })
      ws['!cols'] = colWidths
    } else {
      ws = XLSX.utils.json_to_sheet([{}])
    }
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
  }
  
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  downloadBlob(blob, filename)
}
