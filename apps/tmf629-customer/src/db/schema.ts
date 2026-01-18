import { boolean, jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  href: varchar('href', { length: 500 }),
  type: varchar('type', { length: 100 }).notNull(),
  baseType: varchar('base_type', { length: 100 }),
  schemaLocation: varchar('schema_location', { length: 500 }),
  name: varchar('name', { length: 255 }),
  status: varchar('status', { length: 50 }),
  statusReason: varchar('status_reason', { length: 500 }),
  validForStart: timestamp('valid_for_start'),
  validForEnd: timestamp('valid_for_end'),
  engagedPartyId: varchar('engaged_party_id', { length: 100 }),
  engagedPartyHref: varchar('engaged_party_href', { length: 500 }),
  engagedPartyName: varchar('engaged_party_name', { length: 255 }),
  engagedPartyReferredType: varchar('engaged_party_referred_type', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export const customerCharacteristics = pgTable('customer_characteristics', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  value: jsonb('value'),
  valueType: varchar('value_type', { length: 100 })
})

export const customerContactMediums = pgTable('customer_contact_mediums', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),
  mediumType: varchar('medium_type', { length: 100 }).notNull(),
  preferred: boolean('preferred').default(false),
  characteristic: jsonb('characteristic'),
  validForStart: timestamp('valid_for_start'),
  validForEnd: timestamp('valid_for_end')
})

export const customerRelatedParties = pgTable('customer_related_parties', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),
  referencedPartyId: varchar('referenced_party_id', { length: 100 }),
  referencedPartyHref: varchar('referenced_party_href', { length: 500 }),
  name: varchar('name', { length: 255 }),
  role: varchar('role', { length: 100 }).notNull(),
  referredType: varchar('referred_type', { length: 100 }).notNull()
})

export const eventSubscriptions = pgTable('event_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  callback: varchar('callback', { length: 500 }).notNull(),
  query: varchar('query', { length: 1000 })
})

export const customersRelations = relations(customers, ({ many }) => ({
  characteristics: many(customerCharacteristics),
  contactMediums: many(customerContactMediums),
  relatedParties: many(customerRelatedParties)
}))

export const customerCharacteristicsRelations = relations(
  customerCharacteristics,
  ({ one }) => ({
    customer: one(customers, {
      fields: [customerCharacteristics.customerId],
      references: [customers.id]
    })
  })
)

export const customerContactMediumsRelations = relations(
  customerContactMediums,
  ({ one }) => ({
    customer: one(customers, {
      fields: [customerContactMediums.customerId],
      references: [customers.id]
    })
  })
)

export const customerRelatedPartiesRelations = relations(
  customerRelatedParties,
  ({ one }) => ({
    customer: one(customers, {
      fields: [customerRelatedParties.customerId],
      references: [customers.id]
    })
  })
)
