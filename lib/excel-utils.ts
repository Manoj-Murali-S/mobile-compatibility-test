import * as XLSX from 'xlsx'

export type ImportRow = { brand: string; model: string; year?: number; variants?: string }

export function parseMobileWorkbook(file: File): Promise<{ rows: ImportRow[]; errors: string[] }> {
  return file.arrayBuffer().then((buffer) => {
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
    const errors: string[] = []
    const rows = raw.map((item, index) => {
      const brand = String(item.brand ?? item.Brand ?? '').trim()
      const model = String(item.model ?? item.Model ?? '').trim()
      const yearValue = Number(item.year ?? item.Year ?? '')
      if (!brand || !model) errors.push(`Row ${index + 2}: brand and model are required`)
      return { brand, model, year: Number.isFinite(yearValue) && yearValue > 0 ? yearValue : undefined, variants: String(item.variants ?? item.Variants ?? '') }
    }).filter((row) => row.brand && row.model)
    return { rows, errors }
  })
}

export function buildMobileWorkbook(rows: ImportRow[]) {
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Mobiles')
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
}
