import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../src/db/schema'

export interface TestContext {
  db: ReturnType<typeof drizzle<typeof schema>>
  connectionString: string
  cleanup: () => Promise<void>
}

const TEST_DB_PREFIX = 'test_tmf673_address_'

export async function setupTestDatabase(): Promise<TestContext> {
  const adminUrl =
    process.env.POSTGRES_URL ?? 'postgres://tmforum:tmforum@localhost:5432/postgres'
  const adminClient = postgres(adminUrl, { max: 1 })

  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const dbName = `${TEST_DB_PREFIX}${timestamp}_${random}`

  await adminClient.unsafe(`CREATE DATABASE "${dbName}"`)
  await adminClient.end()

  const connectionString = adminUrl.replace('/postgres', `/${dbName}`)
  const client = postgres(connectionString)
  const db = drizzle(client, { schema })

  await db.execute(`
    CREATE TABLE IF NOT EXISTS geographic_addresses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      href VARCHAR(500),
      type VARCHAR(100) NOT NULL,
      base_type VARCHAR(100),
      schema_location VARCHAR(500),
      city VARCHAR(255),
      country VARCHAR(100),
      locality VARCHAR(255),
      name VARCHAR(255),
      postcode VARCHAR(50),
      state_or_province VARCHAR(100),
      street_name VARCHAR(255),
      street_nr VARCHAR(50),
      street_nr_last VARCHAR(50),
      street_nr_last_suffix VARCHAR(50),
      street_nr_suffix VARCHAR(50),
      street_suffix VARCHAR(50),
      street_type VARCHAR(100),
      geographic_location JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS geographic_sub_addresses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      href VARCHAR(500),
      geographic_address_id UUID NOT NULL REFERENCES geographic_addresses(id) ON DELETE CASCADE,
      type VARCHAR(100) NOT NULL,
      base_type VARCHAR(100),
      schema_location VARCHAR(500),
      building_name VARCHAR(255),
      level_number VARCHAR(50),
      level_type VARCHAR(100),
      name VARCHAR(255),
      private_street_name VARCHAR(255),
      private_street_number VARCHAR(50),
      sub_address_type VARCHAR(100),
      sub_unit_number VARCHAR(50),
      sub_unit_type VARCHAR(100),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS event_subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      callback VARCHAR(500) NOT NULL,
      query VARCHAR(1000)
    )
  `)

  const cleanup = async () => {
    await client.end()
    const cleanupClient = postgres(adminUrl, { max: 1 })
    await cleanupClient.unsafe(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbName}' AND pid <> pg_backend_pid()`
    )
    await cleanupClient.unsafe(`DROP DATABASE IF EXISTS "${dbName}"`)
    await cleanupClient.end()
  }

  return { db, connectionString, cleanup }
}
