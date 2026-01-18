# TM Forum APIs - Specification

## Overview

This project implements four TM Forum Open APIs as microservices for educational purposes. The implementation follows TM Forum specifications strictly while using a modern TypeScript stack.

### APIs Implemented

| API | Name | Description |
|-----|------|-------------|
| TMF632 | Party Management | Manages individuals and organizations |
| TMF673 | Geographic Address | Manages addresses and sub-addresses |
| TMF629 | Customer Management | Manages customers (references Party) |
| TMF620 | Product Catalog | Manages catalogs, categories, offerings, and specifications |

### Tech Stack

- **Runtime**: Bun
- **Framework**: Hono
- **Database**: PostgreSQL (single instance, separate databases per service)
- **ORM**: Drizzle
- **Message Broker**: Redis (pub/sub for events)
- **Monorepo**: Turborepo
- **Testing**: Bun test runner
- **Containerization**: Docker & Docker Compose

---

## Architecture

### Monorepo Structure

```
tm-forum-apis/
├── apps/
│   ├── tmf620-product-catalog/
│   ├── tmf629-customer/
│   ├── tmf632-party/
│   └── tmf673-geographic-address/
├── packages/
│   ├── shared/
│   ├── tmf-common/
│   └── database/
├── docker/
│   ├── docker-compose.yml
│   └── init-databases.sql
├── turbo.json
├── package.json
├── tsconfig.json
└── README.md
```

### Service Structure (Template)

Each service follows this structure:

```
apps/tmf6xx-service-name/
├── src/
│   ├── index.ts              # Hono app entry point
│   ├── routes/
│   │   ├── entity-name.ts    # Route handlers
│   │   └── hub.ts            # Event subscription endpoints
│   ├── services/
│   │   └── entity-name.service.ts
│   ├── db/
│   │   ├── schema.ts         # Drizzle schema
│   │   ├── migrations/
│   │   └── client.ts         # Database client
│   ├── events/
│   │   └── publisher.ts      # Event publishing
│   └── types/
│       └── index.ts          # DTOs and API types
├── tests/
│   ├── setup.ts              # Test setup/teardown
│   └── entity-name.test.ts   # Integration tests
├── drizzle.config.ts
├── Dockerfile
└── package.json
```

### Database Architecture

- **Single PostgreSQL instance** with four separate databases:
  - `tmf620_product_catalog`
  - `tmf629_customer`
  - `tmf632_party`
  - `tmf673_geographic_address`
- Each service owns its database exclusively
- No cross-database joins; services communicate via REST

### Event Architecture

- **Redis pub/sub** for event distribution
- Simplified TMF688-inspired event format
- Services publish events on create, update, delete operations
- Hub endpoints allow external systems to register callbacks

---

## Shared Packages

### @tm-forum/shared

Common types and interfaces used across all services.

```typescript
// Base entity fields (all TM Forum entities have these)
interface TMForumEntity {
  id: string
  href: string
  '@type': string
  '@baseType'?: string
  '@schemaLocation'?: string
}

// Related party reference
interface RelatedParty {
  id: string
  href?: string
  name?: string
  role: string
  '@type'?: string
  '@referredType': string
}

// Time period
interface TimePeriod {
  startDateTime?: string
  endDateTime?: string
}

// Characteristic (flexible key-value)
interface Characteristic {
  id?: string
  name: string
  value: any
  valueType?: string
  '@type'?: string
}

// Contact medium
interface ContactMedium {
  id?: string
  mediumType: string
  preferred?: boolean
  characteristic: MediumCharacteristic
  validFor?: TimePeriod
  '@type'?: string
}

// TM Forum error response
interface TMForumError {
  code: string
  reason: string
  message?: string
  status?: string
  referenceError?: string
  '@type'?: string
}

// Pagination
interface PaginatedResponse<T> {
  items: T[]
  totalCount: number
  offset: number
  limit: number
}
```

### @tm-forum/tmf-common

Hono middleware and utilities for TM Forum compliance.

**Middleware:**

1. **fieldsFilter** - Implements `?fields=` query parameter for partial responses
2. **errorHandler** - Converts errors to TM Forum error format
3. **requestId** - Adds X-Request-Id header tracking
4. **pagination** - Parses `?offset=` and `?limit=` parameters

**Utilities:**

1. **createHref** - Generates href URLs for entities
2. **publishEvent** - Publishes events to Redis
3. **HubManager** - Manages event subscriptions and callbacks

**Event Types:**

```typescript
interface TMForumEvent<T> {
  eventId: string
  eventTime: string
  eventType: string
  correlationId?: string
  domain: string
  title: string
  description?: string
  event: {
    [key: string]: T
  }
}

type EventType = 
  | 'CreateEvent'
  | 'AttributeValueChangeEvent'
  | 'StateChangeEvent'
  | 'DeleteEvent'
```

### @tm-forum/database

Database utilities and helpers.

```typescript
// Common column definitions for Drizzle schemas
const tmForumColumns = {
  id: uuid('id').primaryKey().defaultRandom(),
  href: varchar('href', { length: 500 }),
  type: varchar('type', { length: 100 }).notNull(),
  baseType: varchar('base_type', { length: 100 }),
  schemaLocation: varchar('schema_location', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}

// Test database utilities
async function createTestDatabase(baseName: string): Promise<TestDatabase>
async function destroyTestDatabase(db: TestDatabase): Promise<void>
```

---

## API Specifications

### TMF632 Party Management

**Base Path:** `/tmf-api/partyManagement/v4`

#### Entities

**Individual** (`/individual`)
- Represents a person
- Fields: id, href, gender, placeOfBirth, countryOfBirth, nationality, maritalStatus, birthDate, deathDate, title, givenName, familyName, middleName, fullName, formattedName, location, status
- Related: contactMedium[], externalReference[], partyCharacteristic[], relatedParty[], taxExemptionCertificate[], creditRating[], individualIdentification[], languageAbility[], disability[], otherName[], skill[]

**Organization** (`/organization`)
- Represents a company or organization
- Fields: id, href, isHeadOffice, isLegalEntity, name, nameType, organizationType, tradingName, status
- Related: contactMedium[], externalReference[], partyCharacteristic[], relatedParty[], taxExemptionCertificate[], creditRating[], existsDuring, organizationIdentification[], organizationChildRelationship[], organizationParentRelationship[], otherName[]

**Hub** (`/hub`)
- Event subscription management
- POST to subscribe, DELETE to unsubscribe

#### Database Schema

```
parties
├── id (uuid, PK)
├── href (varchar)
├── party_type (varchar) -- 'Individual' or 'Organization'
├── type (varchar) -- @type
├── base_type (varchar) -- @baseType
├── schema_location (varchar)
├── status (varchar)
├── status_reason (varchar)
├── valid_for_start (timestamp)
├── valid_for_end (timestamp)
├── created_at (timestamp)
├── updated_at (timestamp)
│
│-- Individual-specific columns
├── gender (varchar)
├── place_of_birth (varchar)
├── country_of_birth (varchar)
├── nationality (varchar)
├── marital_status (varchar)
├── birth_date (date)
├── death_date (date)
├── title (varchar)
├── given_name (varchar)
├── family_name (varchar)
├── middle_name (varchar)
├── full_name (varchar)
├── formatted_name (varchar)
├── location (varchar)
│
│-- Organization-specific columns
├── is_head_office (boolean)
├── is_legal_entity (boolean)
├── name (varchar)
├── name_type (varchar)
├── organization_type (varchar)
└── trading_name (varchar)

party_characteristics
├── id (uuid, PK)
├── party_id (uuid, FK)
├── name (varchar)
├── value (jsonb)
└── value_type (varchar)

contact_mediums
├── id (uuid, PK)
├── party_id (uuid, FK)
├── medium_type (varchar)
├── preferred (boolean)
├── characteristic (jsonb)
├── valid_for_start (timestamp)
└── valid_for_end (timestamp)

related_parties
├── id (uuid, PK)
├── source_party_id (uuid, FK)
├── referenced_party_id (uuid)
├── referenced_party_href (varchar)
├── name (varchar)
├── role (varchar)
└── referred_type (varchar)

event_subscriptions (hub)
├── id (uuid, PK)
├── callback (varchar)
└── query (varchar)
```

#### Events

- IndividualCreateEvent
- IndividualAttributeValueChangeEvent
- IndividualStateChangeEvent
- IndividualDeleteEvent
- OrganizationCreateEvent
- OrganizationAttributeValueChangeEvent
- OrganizationStateChangeEvent
- OrganizationDeleteEvent

---

### TMF673 Geographic Address Management

**Base Path:** `/tmf-api/geographicAddressManagement/v4`

#### Entities

**GeographicAddress** (`/geographicAddress`)
- Represents a physical address
- Fields: id, href, city, country, locality, name, postcode, stateOrProvince, streetName, streetNr, streetNrLast, streetNrLastSuffix, streetNrSuffix, streetSuffix, streetType
- Related: geographicLocation, geographicSubAddress[]

**GeographicSubAddress** (`/geographicSubAddress`)
- Represents a sub-unit within an address (apartment, suite, etc.)
- Fields: id, href, buildingName, levelNumber, levelType, name, privateStreetName, privateStreetNumber, subAddressType, subUnitNumber, subUnitType

**Hub** (`/hub`)

#### Database Schema

```
geographic_addresses
├── id (uuid, PK)
├── href (varchar)
├── type (varchar)
├── base_type (varchar)
├── schema_location (varchar)
├── city (varchar)
├── country (varchar)
├── locality (varchar)
├── name (varchar)
├── postcode (varchar)
├── state_or_province (varchar)
├── street_name (varchar)
├── street_nr (varchar)
├── street_nr_last (varchar)
├── street_nr_last_suffix (varchar)
├── street_nr_suffix (varchar)
├── street_suffix (varchar)
├── street_type (varchar)
├── geographic_location (jsonb)
├── created_at (timestamp)
└── updated_at (timestamp)

geographic_sub_addresses
├── id (uuid, PK)
├── href (varchar)
├── geographic_address_id (uuid, FK)
├── type (varchar)
├── base_type (varchar)
├── schema_location (varchar)
├── building_name (varchar)
├── level_number (varchar)
├── level_type (varchar)
├── name (varchar)
├── private_street_name (varchar)
├── private_street_number (varchar)
├── sub_address_type (varchar)
├── sub_unit_number (varchar)
├── sub_unit_type (varchar)
├── created_at (timestamp)
└── updated_at (timestamp)

event_subscriptions (hub)
├── id (uuid, PK)
├── callback (varchar)
└── query (varchar)
```

#### Events

- GeographicAddressCreateEvent
- GeographicAddressAttributeValueChangeEvent
- GeographicAddressDeleteEvent
- GeographicSubAddressCreateEvent
- GeographicSubAddressAttributeValueChangeEvent
- GeographicSubAddressDeleteEvent

---

### TMF629 Customer Management

**Base Path:** `/tmf-api/customerManagement/v4`

#### Entities

**Customer** (`/customer`)
- Represents a customer (links to a Party)
- Fields: id, href, name, status, statusReason, validFor
- Related: account[], agreement[], characteristic[], contactMedium[], creditProfile[], engagedParty (RelatedParty - required), paymentMethod[], relatedParty[]

**Hub** (`/hub`)

#### Cross-Service Dependencies

- **engagedParty** must reference a valid Party from TMF632
- Service makes REST call to TMF632 to validate party exists on create/update

#### Database Schema

```
customers
├── id (uuid, PK)
├── href (varchar)
├── type (varchar)
├── base_type (varchar)
├── schema_location (varchar)
├── name (varchar)
├── status (varchar)
├── status_reason (varchar)
├── valid_for_start (timestamp)
├── valid_for_end (timestamp)
├── engaged_party_id (varchar)
├── engaged_party_href (varchar)
├── engaged_party_name (varchar)
├── engaged_party_referred_type (varchar)
├── created_at (timestamp)
└── updated_at (timestamp)

customer_characteristics
├── id (uuid, PK)
├── customer_id (uuid, FK)
├── name (varchar)
├── value (jsonb)
└── value_type (varchar)

customer_contact_mediums
├── id (uuid, PK)
├── customer_id (uuid, FK)
├── medium_type (varchar)
├── preferred (boolean)
├── characteristic (jsonb)
├── valid_for_start (timestamp)
└── valid_for_end (timestamp)

customer_related_parties
├── id (uuid, PK)
├── customer_id (uuid, FK)
├── referenced_party_id (varchar)
├── referenced_party_href (varchar)
├── name (varchar)
├── role (varchar)
└── referred_type (varchar)

event_subscriptions (hub)
├── id (uuid, PK)
├── callback (varchar)
└── query (varchar)
```

#### Events

- CustomerCreateEvent
- CustomerAttributeValueChangeEvent
- CustomerStateChangeEvent
- CustomerDeleteEvent

---

### TMF620 Product Catalog Management

**Base Path:** `/tmf-api/productCatalogManagement/v4`

#### Entities

**Catalog** (`/catalog`)
- A collection of product offerings
- Fields: id, href, catalogType, description, lastUpdate, lifecycleStatus, name, version, validFor
- Related: category[], relatedParty[]

**Category** (`/category`)
- Hierarchical grouping of product offerings
- Fields: id, href, description, isRoot, lastUpdate, lifecycleStatus, name, version, validFor, parentId
- Related: productOffering[], subCategory[]

**ProductOffering** (`/productOffering`)
- A product available for purchase
- Fields: id, href, description, isBundle, isSellable, lastUpdate, lifecycleStatus, name, statusReason, version, validFor
- Related: agreement[], attachment[], bundledProductOffering[], category[], channel[], marketSegment[], place[], prodSpecCharValueUse[], productOfferingPrice[], productOfferingRelationship[], productOfferingTerm[], productSpecification, resourceCandidate, serviceCandidate

**ProductSpecification** (`/productSpecification`)
- Technical description of a product
- Fields: id, href, brand, description, isBundle, lastUpdate, lifecycleStatus, name, productNumber, version, validFor
- Related: attachment[], bundledProductSpecification[], productSpecCharacteristic[], productSpecificationRelationship[], relatedParty[], resourceSpecification[], serviceSpecification[], targetProductSchema

**Hub** (`/hub`)

#### Database Schema

```
catalogs
├── id (uuid, PK)
├── href (varchar)
├── type (varchar)
├── base_type (varchar)
├── schema_location (varchar)
├── catalog_type (varchar)
├── description (text)
├── last_update (timestamp)
├── lifecycle_status (varchar)
├── name (varchar)
├── version (varchar)
├── valid_for_start (timestamp)
├── valid_for_end (timestamp)
├── created_at (timestamp)
└── updated_at (timestamp)

catalog_categories (join table)
├── catalog_id (uuid, FK)
└── category_id (uuid, FK)

categories
├── id (uuid, PK)
├── href (varchar)
├── type (varchar)
├── base_type (varchar)
├── schema_location (varchar)
├── description (text)
├── is_root (boolean)
├── last_update (timestamp)
├── lifecycle_status (varchar)
├── name (varchar)
├── version (varchar)
├── parent_id (uuid, FK, self-referential)
├── valid_for_start (timestamp)
├── valid_for_end (timestamp)
├── created_at (timestamp)
└── updated_at (timestamp)

product_offerings
├── id (uuid, PK)
├── href (varchar)
├── type (varchar)
├── base_type (varchar)
├── schema_location (varchar)
├── description (text)
├── is_bundle (boolean)
├── is_sellable (boolean)
├── last_update (timestamp)
├── lifecycle_status (varchar)
├── name (varchar)
├── status_reason (varchar)
├── version (varchar)
├── valid_for_start (timestamp)
├── valid_for_end (timestamp)
├── product_specification_id (uuid, FK)
├── created_at (timestamp)
└── updated_at (timestamp)

product_offering_categories (join table)
├── product_offering_id (uuid, FK)
└── category_id (uuid, FK)

product_specifications
├── id (uuid, PK)
├── href (varchar)
├── type (varchar)
├── base_type (varchar)
├── schema_location (varchar)
├── brand (varchar)
├── description (text)
├── is_bundle (boolean)
├── last_update (timestamp)
├── lifecycle_status (varchar)
├── name (varchar)
├── product_number (varchar)
├── version (varchar)
├── valid_for_start (timestamp)
├── valid_for_end (timestamp)
├── created_at (timestamp)
└── updated_at (timestamp)

product_spec_characteristics
├── id (uuid, PK)
├── product_specification_id (uuid, FK)
├── name (varchar)
├── description (text)
├── configurable (boolean)
├── extensible (boolean)
├── is_unique (boolean)
├── max_cardinality (integer)
├── min_cardinality (integer)
├── regex (varchar)
├── value_type (varchar)
├── valid_for_start (timestamp)
├── valid_for_end (timestamp)
└── values (jsonb)

catalog_related_parties
├── id (uuid, PK)
├── catalog_id (uuid, FK)
├── referenced_party_id (varchar)
├── referenced_party_href (varchar)
├── name (varchar)
├── role (varchar)
└── referred_type (varchar)

event_subscriptions (hub)
├── id (uuid, PK)
├── callback (varchar)
└── query (varchar)
```

#### Events

- CatalogCreateEvent
- CatalogAttributeValueChangeEvent
- CatalogStateChangeEvent
- CatalogDeleteEvent
- CategoryCreateEvent
- CategoryAttributeValueChangeEvent
- CategoryStateChangeEvent
- CategoryDeleteEvent
- ProductOfferingCreateEvent
- ProductOfferingAttributeValueChangeEvent
- ProductOfferingStateChangeEvent
- ProductOfferingDeleteEvent
- ProductSpecificationCreateEvent
- ProductSpecificationAttributeValueChangeEvent
- ProductSpecificationStateChangeEvent
- ProductSpecificationDeleteEvent

---

## API Conventions

### HTTP Methods

| Method | Usage |
|--------|-------|
| GET | Retrieve resource(s) |
| POST | Create resource |
| PATCH | Partial update (JSON Merge Patch) |
| DELETE | Remove resource |

### Query Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `fields` | Comma-separated list of fields to return | `?fields=id,name,status` |
| `offset` | Pagination offset (default: 0) | `?offset=20` |
| `limit` | Pagination limit (default: 20, max: 100) | `?limit=50` |
| `{field}` | Filter by field value | `?status=active` |

### Response Headers

| Header | Description |
|--------|-------------|
| `X-Total-Count` | Total number of resources (for paginated responses) |
| `X-Request-Id` | Unique request identifier |
| `X-Result-Count` | Number of resources in current response |

### Error Responses

All errors follow TM Forum error format:

```json
{
  "code": "40",
  "reason": "Not Found",
  "message": "Individual with id 123 not found",
  "status": "404",
  "@type": "Error"
}
```

### Standard Error Codes

| HTTP Status | TM Forum Code | Reason |
|-------------|---------------|--------|
| 400 | 20-29 | Bad Request (validation errors) |
| 401 | 40 | Unauthorized |
| 403 | 41 | Forbidden |
| 404 | 60 | Not Found |
| 405 | 61 | Method Not Allowed |
| 409 | 62 | Conflict |
| 500 | 1-9 | Internal Server Error |

---

## Event System

### Event Format

```json
{
  "eventId": "uuid",
  "eventTime": "2024-01-15T10:30:00Z",
  "eventType": "IndividualCreateEvent",
  "correlationId": "uuid",
  "domain": "partyManagement",
  "title": "Individual created",
  "description": "A new individual has been created",
  "event": {
    "individual": {
      "id": "uuid",
      "href": "/tmf-api/partyManagement/v4/individual/uuid",
      "givenName": "John",
      "familyName": "Doe"
    }
  }
}
```

### Hub Subscription

**Subscribe (POST /hub):**
```json
{
  "callback": "https://listener.example.com/callback",
  "query": "eventType=IndividualCreateEvent"
}
```

**Response:**
```json
{
  "id": "uuid",
  "callback": "https://listener.example.com/callback",
  "query": "eventType=IndividualCreateEvent"
}
```

**Unsubscribe (DELETE /hub/{id})**

### Redis Channels

- `tmf632.party.events`
- `tmf673.address.events`
- `tmf629.customer.events`
- `tmf620.catalog.events`

---

## OpenAPI Specifications

Each service must have a complete OpenAPI 3.0 specification that documents all endpoints.

### Requirements

- OpenAPI 3.0.x format (YAML preferred)
- Located at `apps/tmf6xx-service/openapi.yaml`
- Served at runtime via `GET /openapi.yaml` endpoint
- Includes all request/response schemas
- Includes example values for all fields
- Documents all query parameters (fields, offset, limit, filters)
- Documents all error responses

### Structure

```yaml
openapi: 3.0.3
info:
  title: TMF632 Party Management API
  version: 4.0.0
  description: |
    TMF632 Party Management API implementation.
    Manages individuals and organizations.
servers:
  - url: http://localhost:3632/tmf-api/partyManagement/v4
    description: Local development
paths:
  /individual:
    get:
      summary: List individuals
      operationId: listIndividuals
      tags:
        - Individual
      parameters:
        - $ref: '#/components/parameters/Fields'
        - $ref: '#/components/parameters/Offset'
        - $ref: '#/components/parameters/Limit'
      responses:
        '200':
          description: Success
          headers:
            X-Total-Count:
              $ref: '#/components/headers/X-Total-Count'
            X-Result-Count:
              $ref: '#/components/headers/X-Result-Count'
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Individual'
        '400':
          $ref: '#/components/responses/BadRequest'
        '500':
          $ref: '#/components/responses/InternalServerError'
    post:
      summary: Create an individual
      operationId: createIndividual
      tags:
        - Individual
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/IndividualCreate'
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Individual'
        '400':
          $ref: '#/components/responses/BadRequest'
        '500':
          $ref: '#/components/responses/InternalServerError'
  # ... more paths
components:
  parameters:
    Fields:
      name: fields
      in: query
      description: Comma-separated list of fields to include in response
      schema:
        type: string
      example: id,givenName,familyName
    Offset:
      name: offset
      in: query
      description: Pagination offset
      schema:
        type: integer
        default: 0
        minimum: 0
    Limit:
      name: limit
      in: query
      description: Pagination limit
      schema:
        type: integer
        default: 20
        minimum: 1
        maximum: 100
  headers:
    X-Total-Count:
      description: Total number of resources
      schema:
        type: integer
    X-Result-Count:
      description: Number of resources in response
      schema:
        type: integer
  schemas:
    Individual:
      type: object
      properties:
        id:
          type: string
          format: uuid
        href:
          type: string
          format: uri
        '@type':
          type: string
          default: Individual
        # ... all fields
    IndividualCreate:
      type: object
      properties:
        # ... writable fields only
    Error:
      type: object
      required:
        - code
        - reason
      properties:
        code:
          type: string
        reason:
          type: string
        message:
          type: string
        status:
          type: string
        '@type':
          type: string
          default: Error
  responses:
    BadRequest:
      description: Bad Request
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            code: "20"
            reason: Bad Request
            message: Invalid request body
            status: "400"
            '@type': Error
    NotFound:
      description: Not Found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            code: "60"
            reason: Not Found
            message: Resource not found
            status: "404"
            '@type': Error
    InternalServerError:
      description: Internal Server Error
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            code: "1"
            reason: Internal Server Error
            message: An unexpected error occurred
            status: "500"
            '@type': Error
```

### Shared Components

Common OpenAPI components should be defined in `packages/shared/openapi/` and referenced by each service:

```
packages/shared/openapi/
├── parameters.yaml    # Fields, Offset, Limit, common filters
├── headers.yaml       # X-Total-Count, X-Result-Count, X-Request-Id
├── responses.yaml     # BadRequest, NotFound, InternalServerError
└── schemas/
    ├── error.yaml
    ├── related-party.yaml
    ├── time-period.yaml
    ├── characteristic.yaml
    └── contact-medium.yaml
```

### Validation

- Use a library like `@hono/zod-openapi` or generate schemas from OpenAPI
- Request validation should match OpenAPI schema
- Response validation in tests to ensure API matches spec

---

## Testing Strategy

### Integration Tests

Each service has integration tests that:
1. Create an ephemeral test database
2. Run the Hono app against the test database
3. Make HTTP requests to test endpoints
4. Verify responses and database state
5. Destroy the test database

### Test Structure

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { createTestDatabase, destroyTestDatabase } from '@tm-forum/database'
import { createApp } from '../src/index'

describe('Individual API', () => {
  let app: Hono
  let testDb: TestDatabase

  beforeAll(async () => {
    testDb = await createTestDatabase('tmf632_party')
    app = createApp(testDb.connectionString)
  })

  afterAll(async () => {
    await destroyTestDatabase(testDb)
  })

  describe('POST /individual', () => {
    it('should create an individual', async () => {
      // Arrange
      const payload = {
        givenName: 'John',
        familyName: 'Doe'
      }

      // Act
      const response = await app.request('/tmf-api/partyManagement/v4/individual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      // Assert
      expect(response.status).toEqual(201)
      const body = await response.json()
      expect(body.givenName).toEqual('John')
      expect(body.familyName).toEqual('Doe')
      expect(body.id).toBeDefined()
      expect(body.href).toBeDefined()
    })
  })
})
```

### Test Coverage Requirements

- All CRUD operations
- Query parameter filtering (`fields`, pagination, field filters)
- Error scenarios (not found, validation errors)
- Event publishing verification
- Cross-service calls (TMF629 → TMF632)

---

## Coding Conventions

### General

- No semicolons in TypeScript
- No comments on the same line as code
- No comments that restate what code does
- Always use curly braces for if statements
- Order things alphabetically (imports, object keys, etc.)
- Use `list` prefix for functions returning arrays
- Use `find` prefix for functions returning single item or undefined

### Prettier Configuration

```json
{
  "arrowParens": "always",
  "bracketSameLine": false,
  "bracketSpacing": true,
  "proseWrap": "always",
  "semi": false,
  "singleAttributePerLine": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "none"
}
```

### Testing

- Use `toEqual` over `toBe` for comparing objects
- Follow Arrange, Act, Assert pattern
- No snapshots

---

## Docker Configuration

### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: tmforum
      POSTGRES_PASSWORD: tmforum
      POSTGRES_DB: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-databases.sql:/docker-entrypoint-initdb.d/init-databases.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tmforum"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

### init-databases.sql

```sql
CREATE DATABASE tmf620_product_catalog;
CREATE DATABASE tmf629_customer;
CREATE DATABASE tmf632_party;
CREATE DATABASE tmf673_geographic_address;
```

### Service Dockerfiles

```dockerfile
FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
```

---

## Environment Variables

### Service Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | 3000 |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_URL` | Redis connection string | redis://localhost:6379 |
| `BASE_URL` | Base URL for href generation | http://localhost:3000 |
| `LOG_LEVEL` | Logging level | info |

### Port Assignments (Local Development)

| Service | Port |
|---------|------|
| TMF620 Product Catalog | 3620 |
| TMF629 Customer | 3629 |
| TMF632 Party | 3632 |
| TMF673 Geographic Address | 3673 |

---

## References

- [TMF632 Party Management API](https://www.tmforum.org/resources/specification/tmf632-party-management-api-rest-specification-r19-0-0/)
- [TMF673 Geographic Address API](https://www.tmforum.org/resources/specification/tmf673-geographic-address-management-api-rest-specification-r19-0-0/)
- [TMF629 Customer Management API](https://www.tmforum.org/resources/specification/tmf629-customer-management-api-rest-specification-r19-0-0/)
- [TMF620 Product Catalog API](https://www.tmforum.org/resources/specification/tmf620-product-catalog-management-api-rest-specification-r19-0-0/)
- [TMF688 Event Management API](https://www.tmforum.org/resources/specification/tmf688-event-management-api-rest-specification-r19-0-0/)
