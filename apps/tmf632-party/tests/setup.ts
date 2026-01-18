import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import * as schema from '../src/db/schema'

export interface TestContext {
  db: ReturnType<typeof drizzle<typeof schema>>
  connectionString: string
  cleanup: () => Promise<void>
}

const TEST_DB_PREFIX = 'test_tmf632_party_'

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
    CREATE TABLE IF NOT EXISTS parties (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      href VARCHAR(500),
      party_type VARCHAR(50) NOT NULL,
      type VARCHAR(100) NOT NULL,
      base_type VARCHAR(100),
      schema_location VARCHAR(500),
      status VARCHAR(50),
      status_reason VARCHAR(500),
      valid_for_start TIMESTAMP,
      valid_for_end TIMESTAMP,
      gender VARCHAR(50),
      place_of_birth VARCHAR(255),
      country_of_birth VARCHAR(100),
      nationality VARCHAR(100),
      marital_status VARCHAR(50),
      birth_date DATE,
      death_date DATE,
      title VARCHAR(50),
      given_name VARCHAR(255),
      family_name VARCHAR(255),
      middle_name VARCHAR(255),
      full_name VARCHAR(500),
      formatted_name VARCHAR(500),
      location VARCHAR(500),
      is_head_office BOOLEAN,
      is_legal_entity BOOLEAN,
      name VARCHAR(255),
      name_type VARCHAR(100),
      organization_type VARCHAR(100),
      trading_name VARCHAR(255),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS party_characteristics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      value JSONB,
      value_type VARCHAR(100)
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS contact_mediums (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
      medium_type VARCHAR(100) NOT NULL,
      preferred BOOLEAN DEFAULT false,
      characteristic JSONB,
      valid_for_start TIMESTAMP,
      valid_for_end TIMESTAMP
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS related_parties (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      source_party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
      referenced_party_id UUID,
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
