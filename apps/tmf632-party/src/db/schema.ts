import { boolean, date, jsonb, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const parties = pgTable('parties', {
  id: uuid('id').primaryKey().defaultRandom(),
  href: varchar('href', { length: 500 }),
  partyType: varchar('party_type', { length: 50 }).notNull(),
  type: varchar('type', { length: 100 }).notNull(),
  baseType: varchar('base_type', { length: 100 }),
  schemaLocation: varchar('schema_location', { length: 500 }),
  status: varchar('status', { length: 50 }),
  statusReason: varchar('status_reason', { length: 500 }),
  validForStart: timestamp('valid_for_start'),
  validForEnd: timestamp('valid_for_end'),

  gender: varchar('gender', { length: 50 }),
  placeOfBirth: varchar('place_of_birth', { length: 255 }),
  countryOfBirth: varchar('country_of_birth', { length: 100 }),
  nationality: varchar('nationality', { length: 100 }),
  maritalStatus: varchar('marital_status', { length: 50 }),
  birthDate: date('birth_date'),
  deathDate: date('death_date'),
  title: varchar('title', { length: 50 }),
  givenName: varchar('given_name', { length: 255 }),
  familyName: varchar('family_name', { length: 255 }),
  middleName: varchar('middle_name', { length: 255 }),
  fullName: varchar('full_name', { length: 500 }),
  formattedName: varchar('formatted_name', { length: 500 }),
  location: varchar('location', { length: 500 }),

  isHeadOffice: boolean('is_head_office'),
  isLegalEntity: boolean('is_legal_entity'),
  name: varchar('name', { length: 255 }),
  nameType: varchar('name_type', { length: 100 }),
  organizationType: varchar('organization_type', { length: 100 }),
  tradingName: varchar('trading_name', { length: 255 }),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export const partyCharacteristics = pgTable('party_characteristics', {
  id: uuid('id').primaryKey().defaultRandom(),
  partyId: uuid('party_id')
    .notNull()
    .references(() => parties.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  value: jsonb('value'),
  valueType: varchar('value_type', { length: 100 })
})

export const contactMediums = pgTable('contact_mediums', {
  id: uuid('id').primaryKey().defaultRandom(),
  partyId: uuid('party_id')
    .notNull()
    .references(() => parties.id, { onDelete: 'cascade' }),
  mediumType: varchar('medium_type', { length: 100 }).notNull(),
  preferred: boolean('preferred').default(false),
  characteristic: jsonb('characteristic'),
  validForStart: timestamp('valid_for_start'),
  validForEnd: timestamp('valid_for_end')
})

export const relatedParties = pgTable('related_parties', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourcePartyId: uuid('source_party_id')
    .notNull()
    .references(() => parties.id, { onDelete: 'cascade' }),
  referencedPartyId: uuid('referenced_party_id'),
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

export const partiesRelations = relations(parties, ({ many }) => ({
  characteristics: many(partyCharacteristics),
  contactMediums: many(contactMediums),
  relatedParties: many(relatedParties)
}))

export const partyCharacteristicsRelations = relations(
  partyCharacteristics,
  ({ one }) => ({
    party: one(parties, {
      fields: [partyCharacteristics.partyId],
      references: [parties.id]
    })
  })
)

export const contactMediumsRelations = relations(contactMediums, ({ one }) => ({
  party: one(parties, {
    fields: [contactMediums.partyId],
    references: [parties.id]
  })
}))

export const relatedPartiesRelations = relations(relatedParties, ({ one }) => ({
  party: one(parties, {
    fields: [relatedParties.sourcePartyId],
    references: [parties.id]
  })
}))
