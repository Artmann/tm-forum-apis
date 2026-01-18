import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

export interface DatabaseConfig {
  connectionString: string
  max?: number
  idleTimeout?: number
}

export function createConnection(config: DatabaseConfig) {
  const client = postgres(config.connectionString, {
    max: config.max ?? 10,
    idle_timeout: config.idleTimeout ?? 20
  })

  return drizzle(client)
}

export function createConnectionString(options: {
  host: string
  port: number
  database: string
  user: string
  password: string
}): string {
  const { host, port, database, user, password } = options
  return `postgres://${user}:${password}@${host}:${port}/${database}`
}

export type Database = ReturnType<typeof createConnection>
