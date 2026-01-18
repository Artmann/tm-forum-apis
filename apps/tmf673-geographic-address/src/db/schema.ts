import { jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const geographicAddresses = pgTable('geographic_addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  href: varchar('href', { length: 500 }),
  type: varchar('type', { length: 100 }).notNull(),
  baseType: varchar('base_type', { length: 100 }),
  schemaLocation: varchar('schema_location', { length: 500 }),
  city: varchar('city', { length: 255 }),
  country: varchar('country', { length: 100 }),
  locality: varchar('locality', { length: 255 }),
  name: varchar('name', { length: 255 }),
  postcode: varchar('postcode', { length: 50 }),
  stateOrProvince: varchar('state_or_province', { length: 100 }),
  streetName: varchar('street_name', { length: 255 }),
  streetNr: varchar('street_nr', { length: 50 }),
  streetNrLast: varchar('street_nr_last', { length: 50 }),
  streetNrLastSuffix: varchar('street_nr_last_suffix', { length: 50 }),
  streetNrSuffix: varchar('street_nr_suffix', { length: 50 }),
  streetSuffix: varchar('street_suffix', { length: 50 }),
  streetType: varchar('street_type', { length: 100 }),
  geographicLocation: jsonb('geographic_location'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export const geographicSubAddresses = pgTable('geographic_sub_addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  href: varchar('href', { length: 500 }),
  geographicAddressId: uuid('geographic_address_id')
    .notNull()
    .references(() => geographicAddresses.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 100 }).notNull(),
  baseType: varchar('base_type', { length: 100 }),
  schemaLocation: varchar('schema_location', { length: 500 }),
  buildingName: varchar('building_name', { length: 255 }),
  levelNumber: varchar('level_number', { length: 50 }),
  levelType: varchar('level_type', { length: 100 }),
  name: varchar('name', { length: 255 }),
  privateStreetName: varchar('private_street_name', { length: 255 }),
  privateStreetNumber: varchar('private_street_number', { length: 50 }),
  subAddressType: varchar('sub_address_type', { length: 100 }),
  subUnitNumber: varchar('sub_unit_number', { length: 50 }),
  subUnitType: varchar('sub_unit_type', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export const eventSubscriptions = pgTable('event_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  callback: varchar('callback', { length: 500 }).notNull(),
  query: varchar('query', { length: 1000 })
})

export const geographicAddressesRelations = relations(
  geographicAddresses,
  ({ many }) => ({
    subAddresses: many(geographicSubAddresses)
  })
)

export const geographicSubAddressesRelations = relations(
  geographicSubAddresses,
  ({ one }) => ({
    address: one(geographicAddresses, {
      fields: [geographicSubAddresses.geographicAddressId],
      references: [geographicAddresses.id]
    })
  })
)
