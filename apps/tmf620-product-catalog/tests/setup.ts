import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../src/db/schema'

export interface TestContext {
  db: ReturnType<typeof drizzle<typeof schema>>
  connectionString: string
  cleanup: () => Promise<void>
}

const TEST_DB_PREFIX = 'test_tmf620_catalog_'

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
    CREATE TABLE IF NOT EXISTS catalogs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      href VARCHAR(500),
      type VARCHAR(100) NOT NULL,
      base_type VARCHAR(100),
      schema_location VARCHAR(500),
      catalog_type VARCHAR(100),
      description TEXT,
      last_update TIMESTAMP,
      lifecycle_status VARCHAR(50),
      name VARCHAR(255),
      version VARCHAR(50),
      valid_for_start TIMESTAMP,
      valid_for_end TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      href VARCHAR(500),
      type VARCHAR(100) NOT NULL,
      base_type VARCHAR(100),
      schema_location VARCHAR(500),
      description TEXT,
      is_root BOOLEAN DEFAULT false,
      last_update TIMESTAMP,
      lifecycle_status VARCHAR(50),
      name VARCHAR(255),
      version VARCHAR(50),
      parent_id UUID,
      valid_for_start TIMESTAMP,
      valid_for_end TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS product_specifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      href VARCHAR(500),
      type VARCHAR(100) NOT NULL,
      base_type VARCHAR(100),
      schema_location VARCHAR(500),
      brand VARCHAR(255),
      description TEXT,
      is_bundle BOOLEAN DEFAULT false,
      last_update TIMESTAMP,
      lifecycle_status VARCHAR(50),
      name VARCHAR(255),
      product_number VARCHAR(100),
      version VARCHAR(50),
      valid_for_start TIMESTAMP,
      valid_for_end TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS product_offerings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      href VARCHAR(500),
      type VARCHAR(100) NOT NULL,
      base_type VARCHAR(100),
      schema_location VARCHAR(500),
      description TEXT,
      is_bundle BOOLEAN DEFAULT false,
      is_sellable BOOLEAN DEFAULT true,
      last_update TIMESTAMP,
      lifecycle_status VARCHAR(50),
      name VARCHAR(255),
      status_reason VARCHAR(500),
      version VARCHAR(50),
      valid_for_start TIMESTAMP,
      valid_for_end TIMESTAMP,
      product_specification_id UUID REFERENCES product_specifications(id),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS catalog_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      catalog_id UUID NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
      category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS product_offering_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_offering_id UUID NOT NULL REFERENCES product_offerings(id) ON DELETE CASCADE,
      category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS product_spec_characteristics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_specification_id UUID NOT NULL REFERENCES product_specifications(id) ON DELETE CASCADE,
      name VARCHAR(255),
      description TEXT,
      configurable BOOLEAN DEFAULT false,
      extensible BOOLEAN DEFAULT false,
      is_unique BOOLEAN DEFAULT false,
      max_cardinality INTEGER,
      min_cardinality INTEGER,
      regex VARCHAR(500),
      value_type VARCHAR(100),
      valid_for_start TIMESTAMP,
      valid_for_end TIMESTAMP,
      values JSONB
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS catalog_related_parties (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      catalog_id UUID NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
      referenced_party_id VARCHAR(100),
      referenced_party_href VARCHAR(500),
      name VARCHAR(255),
      role VARCHAR(100) NOT NULL,
      referred_type VARCHAR(100) NOT NULL
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
