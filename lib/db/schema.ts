import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const shops = pgTable('shops', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const catalogMobiles = pgTable('catalog_mobiles', {
  id: text('id').primaryKey(),
  shopId: text('shop_id').notNull(),
  brand: text('brand').notNull(),
  model: text('model').notNull(),
  year: integer('year'),
  variants: jsonb('variants').notNull().default([]),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const catalogCompatibility = pgTable('catalog_compatibility', {
  id: text('id').primaryKey(),
  shopId: text('shop_id').notNull(),
  accessoryType: text('accessory_type').notNull(),
  sourceModelId: text('source_model_id').notNull(),
  compatibleModelId: text('compatible_model_id').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const catalogBackups = pgTable('catalog_backups', {
  id: text('id').primaryKey(),
  shopId: text('shop_id').notNull(),
  checksum: text('checksum').notNull(),
  payload: jsonb('payload').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
