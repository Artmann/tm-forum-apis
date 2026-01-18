import postgres from 'postgres'
import { createConnection, createConnectionString, type Database } from './connection'

export interface TestDatabase {
  db: Database
  connectionString: string
  databaseName: string
  cleanup: () => Promise<void>
}

export interface TestDatabaseOptions {
  host?: string
  port?: number
  user?: string
  password?: string
  baseDatabase?: string
}

const defaultOptions: Required<TestDatabaseOptions> = {
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
  user: process.env.POSTGRES_USER ?? 'tmforum',
  password: process.env.POSTGRES_PASSWORD ?? 'tmforum',
  baseDatabase: process.env.POSTGRES_DB ?? 'postgres'
}

export async function createTestDatabase(
  baseName: string,
  options: TestDatabaseOptions = {}
): Promise<TestDatabase> {
  const config = { ...defaultOptions, ...options }
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const databaseName = `test_${baseName}_${timestamp}_${random}`

  const adminConnectionString = createConnectionString({
    host: config.host,
    port: config.port,
    database: config.baseDatabase,
    user: config.user,
    password: config.password
  })

  const adminClient = postgres(adminConnectionString, { max: 1 })

  await adminClient.unsafe(`CREATE DATABASE "${databaseName}"`)
  await adminClient.end()

  const connectionString = createConnectionString({
    host: config.host,
    port: config.port,
    database: databaseName,
    user: config.user,
    password: config.password
  })

  const db = createConnection({ connectionString })

  const cleanup = async () => {
    await destroyTestDatabase({
      db,
      connectionString,
      databaseName,
      cleanup: async () => {}
    }, config)
  }

  return {
    db,
    connectionString,
    databaseName,
    cleanup
  }
}

export async function destroyTestDatabase(
  testDb: TestDatabase,
  options: TestDatabaseOptions = {}
): Promise<void> {
  const config = { ...defaultOptions, ...options }

  const adminConnectionString = createConnectionString({
    host: config.host,
    port: config.port,
    database: config.baseDatabase,
    user: config.user,
    password: config.password
  })

  const adminClient = postgres(adminConnectionString, { max: 1 })

  await adminClient.unsafe(
    `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${testDb.databaseName}' AND pid <> pg_backend_pid()`
  )

  await adminClient.unsafe(`DROP DATABASE IF EXISTS "${testDb.databaseName}"`)
  await adminClient.end()
}
