import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { catalogMobiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const DEFAULT_SHOP_ID = 'demo-shop'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const shopId = searchParams.get('shopId') || DEFAULT_SHOP_ID
  const mobiles = await db.select().from(catalogMobiles).where(eq(catalogMobiles.shopId, shopId))
  return NextResponse.json({ shopId, mobiles })
}

export async function POST(request: Request) {
  const body = await request.json()
  const shopId = typeof body.shopId === 'string' ? body.shopId : DEFAULT_SHOP_ID
  if (!Array.isArray(body.mobiles)) return NextResponse.json({ error: 'mobiles must be an array' }, { status: 400 })
  const rows = body.mobiles.map((mobile: { id?: string; brand?: string; model?: string; year?: number; variants?: unknown[] }) => ({
    id: mobile.id || crypto.randomUUID(), shopId, brand: mobile.brand?.trim(), model: mobile.model?.trim(), year: mobile.year, variants: mobile.variants || [], updatedAt: new Date(),
  })).filter((mobile: { brand?: string; model?: string }) => mobile.brand && mobile.model)
  if (rows.length) await db.insert(catalogMobiles).values(rows).onConflictDoUpdate({ target: catalogMobiles.id, set: { brand: rows[0].brand, model: rows[0].model, updatedAt: new Date() } })
  return NextResponse.json({ imported: rows.length })
}
