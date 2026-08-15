import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

// Guard: only connect to PostgreSQL if DATABASE_URL is available.
// In offline-first desktop mode (Electron), this is not set.
const connectionString = process.env.DATABASE_URL

export const pool = connectionString ? new Pool({ connectionString }) : null

// @ts-ignore — pool may be null when running offline-first
export const db = connectionString ? drizzle(pool!, { schema }) : null
