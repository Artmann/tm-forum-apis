import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgres://tmforum:tmforum@localhost:5432/tmf673_geographic_address'

const client = postgres(DATABASE_URL)
export const db = drizzle(client, { schema })
