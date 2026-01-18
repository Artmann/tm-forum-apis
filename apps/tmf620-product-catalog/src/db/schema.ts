import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const catalogs = pgTable('catalogs', {
  id: uuid('id').primaryKey().defaultRandom(),
  href: varchar('href', { length: 500 }),
  type: varchar('type', { length: 100 }).notNull(),
  baseType: varchar('base_type', { length: 100 }),
  schemaLocation: varchar('schema_location', { length: 500 }),
  catalogType: varchar('catalog_type', { length: 100 }),
  description: text('description'),
  lastUpdate: timestamp('last_update'),
  lifecycleStatus: varchar('lifecycle_status', { length: 50 }),
  name: varchar('name', { length: 255 }),
  version: varchar('version', { length: 50 }),
  validForStart: timestamp('valid_for_start'),
  validForEnd: timestamp('valid_for_end'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  href: varchar('href', { length: 500 }),
  type: varchar('type', { length: 100 }).notNull(),
  baseType: varchar('base_type', { length: 100 }),
  schemaLocation: varchar('schema_location', { length: 500 }),
  description: text('description'),
  isRoot: boolean('is_root').default(false),
  lastUpdate: timestamp('last_update'),
  lifecycleStatus: varchar('lifecycle_status', { length: 50 }),
  name: varchar('name', { length: 255 }),
  version: varchar('version', { length: 50 }),
  parentId: uuid('parent_id'),
  validForStart: timestamp('valid_for_start'),
  validForEnd: timestamp('valid_for_end'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export const productOfferings = pgTable('product_offerings', {
  id: uuid('id').primaryKey().defaultRandom(),
  href: varchar('href', { length: 500 }),
  type: varchar('type', { length: 100 }).notNull(),
  baseType: varchar('base_type', { length: 100 }),
  schemaLocation: varchar('schema_location', { length: 500 }),
  description: text('description'),
  isBundle: boolean('is_bundle').default(false),
  isSellable: boolean('is_sellable').default(true),
  lastUpdate: timestamp('last_update'),
  lifecycleStatus: varchar('lifecycle_status', { length: 50 }),
  name: varchar('name', { length: 255 }),
  statusReason: varchar('status_reason', { length: 500 }),
  version: varchar('version', { length: 50 }),
  validForStart: timestamp('valid_for_start'),
  validForEnd: timestamp('valid_for_end'),
  productSpecificationId: uuid('product_specification_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export const productSpecifications = pgTable('product_specifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  href: varchar('href', { length: 500 }),
  type: varchar('type', { length: 100 }).notNull(),
  baseType: varchar('base_type', { length: 100 }),
  schemaLocation: varchar('schema_location', { length: 500 }),
  brand: varchar('brand', { length: 255 }),
  description: text('description'),
  isBundle: boolean('is_bundle').default(false),
  lastUpdate: timestamp('last_update'),
  lifecycleStatus: varchar('lifecycle_status', { length: 50 }),
  name: varchar('name', { length: 255 }),
  productNumber: varchar('product_number', { length: 100 }),
  version: varchar('version', { length: 50 }),
  validForStart: timestamp('valid_for_start'),
  validForEnd: timestamp('valid_for_end'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export const catalogCategories = pgTable('catalog_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  catalogId: uuid('catalog_id')
    .notNull()
    .references(() => catalogs.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' })
})

export const productOfferingCategories = pgTable('product_offering_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  productOfferingId: uuid('product_offering_id')
    .notNull()
    .references(() => productOfferings.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'cascade' })
})

export const productSpecCharacteristics = pgTable('product_spec_characteristics', {
  id: uuid('id').primaryKey().defaultRandom(),
  productSpecificationId: uuid('product_specification_id')
    .notNull()
    .references(() => productSpecifications.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }),
  description: text('description'),
  configurable: boolean('configurable').default(false),
  extensible: boolean('extensible').default(false),
  isUnique: boolean('is_unique').default(false),
  maxCardinality: integer('max_cardinality'),
  minCardinality: integer('min_cardinality'),
  regex: varchar('regex', { length: 500 }),
  valueType: varchar('value_type', { length: 100 }),
  validForStart: timestamp('valid_for_start'),
  validForEnd: timestamp('valid_for_end'),
  values: jsonb('values')
})

export const catalogRelatedParties = pgTable('catalog_related_parties', {
  id: uuid('id').primaryKey().defaultRandom(),
  catalogId: uuid('catalog_id')
    .notNull()
    .references(() => catalogs.id, { onDelete: 'cascade' }),
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

export const catalogsRelations = relations(catalogs, ({ many }) => ({
  categories: many(catalogCategories),
  relatedParties: many(catalogRelatedParties)
}))

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id]
  }),
  subCategories: many(categories),
  productOfferings: many(productOfferingCategories)
}))

export const productOfferingsRelations = relations(productOfferings, ({ one, many }) => ({
  productSpecification: one(productSpecifications, {
    fields: [productOfferings.productSpecificationId],
    references: [productSpecifications.id]
  }),
  categories: many(productOfferingCategories)
}))

export const productSpecificationsRelations = relations(
  productSpecifications,
  ({ many }) => ({
    productOfferings: many(productOfferings),
    characteristics: many(productSpecCharacteristics)
  })
)
