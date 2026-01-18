import { timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const tmForumColumns = {
  id: uuid('id').primaryKey().defaultRandom(),
  href: varchar('href', { length: 500 }),
  type: varchar('type', { length: 100 }).notNull(),
  baseType: varchar('base_type', { length: 100 }),
  schemaLocation: varchar('schema_location', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}

export const validForColumns = {
  validForStart: timestamp('valid_for_start'),
  validForEnd: timestamp('valid_for_end')
}

export const statusColumns = {
  status: varchar('status', { length: 50 }),
  statusReason: varchar('status_reason', { length: 500 })
}

export const lifecycleColumns = {
  lifecycleStatus: varchar('lifecycle_status', { length: 50 }),
  lastUpdate: timestamp('last_update').defaultNow()
}
