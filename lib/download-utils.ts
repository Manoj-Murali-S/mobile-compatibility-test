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

export function downloadImportTemplate() {
  downloadCsv([
    { model_name: 'Galaxy S24', brand: 'Samsung', status: 'active' },
  ], 'mobile-catalog-import-template.csv')
}
