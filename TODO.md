# TM Forum APIs - TODO

## Instructions

This is the implementation task list for the TM Forum APIs project. Work through tasks in order as they build upon each other. Check off tasks as you complete them.

Refer to `SPEC.md` for detailed specifications and requirements.

---

## Phase 1: Repository & Tooling Setup

### 1.1 Initialize Monorepo

- [x] Create project directory `tm-forum-apis`
- [x] Initialize Turborepo with `bunx create-turbo@latest`
- [x] Configure Bun workspaces in root `package.json`
- [x] Create base `tsconfig.json` with strict mode enabled
- [x] Create `.prettierrc` with project settings (see SPEC.md)
- [x] Create `.gitignore` (node_modules, dist, .env, etc.)
- [x] Initialize git repository

### 1.2 Create Directory Structure

- [x] Create `apps/` directory
- [x] Create `apps/tmf620-product-catalog/` placeholder
- [x] Create `apps/tmf629-customer/` placeholder
- [x] Create `apps/tmf632-party/` placeholder
- [x] Create `apps/tmf673-geographic-address/` placeholder
- [x] Create `packages/` directory
- [x] Create `packages/shared/` directory
- [x] Create `packages/tmf-common/` directory
- [x] Create `packages/database/` directory
- [x] Create `docker/` directory

### 1.3 Configure Turborepo

- [x] Create `turbo.json` with pipeline configuration
- [x] Define `build`, `dev`, `test`, `lint` pipelines
- [x] Configure task dependencies (shared packages build first)

### 1.4 Docker Setup

- [x] Create `docker/docker-compose.yml` with PostgreSQL and Redis
- [x] Create `docker/init-databases.sql` to create the 4 databases
- [x] Add health checks for both services
- [ ] Test that `docker compose up` works correctly
- [x] Document Docker commands in README

---

## Phase 2: Shared Packages

### 2.1 @tm-forum/shared

- [x] Initialize package with `package.json` and `tsconfig.json`
- [x] Create `src/index.ts` as main export
- [x] Create `src/types/base.ts` with TMForumEntity interface
- [x] Create `src/types/related-party.ts` with RelatedParty interface
- [x] Create `src/types/time-period.ts` with TimePeriod interface
- [x] Create `src/types/characteristic.ts` with Characteristic interface
- [x] Create `src/types/contact-medium.ts` with ContactMedium interface
- [x] Create `src/types/error.ts` with TMForumError interface
- [x] Create `src/types/pagination.ts` with pagination types
- [x] Create `src/types/event.ts` with TMForumEvent and EventType types
- [x] Export all types from index.ts
- [ ] Verify package builds correctly

### 2.2 @tm-forum/database

- [x] Initialize package with `package.json` and `tsconfig.json`
- [x] Install Drizzle ORM and postgres driver
- [x] Create `src/index.ts` as main export
- [x] Create `src/connection.ts` with database connection factory
- [x] Create `src/columns.ts` with common column definitions
- [x] Create `src/test-utils.ts` with createTestDatabase function
- [x] Create `src/test-utils.ts` with destroyTestDatabase function
- [ ] Test ephemeral database creation/destruction works
- [x] Export all utilities from index.ts

### 2.3 @tm-forum/tmf-common

- [x] Initialize package with `package.json` and `tsconfig.json`
- [x] Install Hono
- [x] Create `src/index.ts` as main export

#### Middleware

- [x] Create `src/middleware/fields-filter.ts` - parses `?fields=` and filters response
- [x] Create `src/middleware/error-handler.ts` - converts errors to TM Forum format
- [x] Create `src/middleware/request-id.ts` - adds X-Request-Id header
- [x] Create `src/middleware/pagination.ts` - parses offset/limit, adds response headers

#### Utilities

- [x] Create `src/utils/href.ts` - createHref function for generating entity hrefs
- [x] Create `src/utils/response.ts` - helper functions for standard responses

#### Events

- [x] Install ioredis
- [x] Create `src/events/publisher.ts` - Redis pub/sub event publisher
- [x] Create `src/events/types.ts` - event type definitions
- [x] Create `src/events/hub-manager.ts` - manages subscriptions and callbacks

- [x] Export all middleware and utilities from index.ts
- [ ] Write basic tests for middleware

### 2.4 @tm-forum/shared OpenAPI Components

- [ ] Create `openapi/` directory in shared package
- [ ] Create `openapi/parameters.yaml` with Fields, Offset, Limit parameters
- [ ] Create `openapi/headers.yaml` with X-Total-Count, X-Result-Count, X-Request-Id
- [ ] Create `openapi/responses.yaml` with BadRequest, NotFound, InternalServerError
- [ ] Create `openapi/schemas/error.yaml`
- [ ] Create `openapi/schemas/related-party.yaml`
- [ ] Create `openapi/schemas/time-period.yaml`
- [ ] Create `openapi/schemas/characteristic.yaml`
- [ ] Create `openapi/schemas/contact-medium.yaml`

---

## Phase 3: TMF632 Party Management API

### 3.1 Project Setup

- [ ] Initialize `apps/tmf632-party` with `package.json`
- [ ] Create `tsconfig.json` extending base config
- [ ] Add dependencies: hono, drizzle-orm, @tm-forum/* packages
- [ ] Create `drizzle.config.ts`
- [ ] Create `src/index.ts` with Hono app entry point
- [ ] Create `src/db/client.ts` with database connection

### 3.2 Database Schema

- [ ] Create `src/db/schema.ts`
- [ ] Define `parties` table (single table inheritance)
- [ ] Define `party_characteristics` table
- [ ] Define `contact_mediums` table
- [ ] Define `related_parties` table
- [ ] Define `event_subscriptions` table
- [ ] Generate initial migration with `drizzle-kit generate`
- [ ] Test migration runs successfully

### 3.3 Types

- [ ] Create `src/types/index.ts`
- [ ] Define `IndividualDto` interface
- [ ] Define `OrganizationDto` interface
- [ ] Define `CreateIndividualRequest` interface
- [ ] Define `UpdateIndividualRequest` interface
- [ ] Define `CreateOrganizationRequest` interface
- [ ] Define `UpdateOrganizationRequest` interface

### 3.4 Individual Service

- [ ] Create `src/services/individual.service.ts`
- [ ] Implement `createIndividual(data)` method
- [ ] Implement `findIndividualById(id)` method
- [ ] Implement `listIndividuals(filters, pagination)` method
- [ ] Implement `updateIndividual(id, data)` method
- [ ] Implement `deleteIndividual(id)` method
- [ ] Implement private `transformIndividual(model)` method
- [ ] Add event publishing on create/update/delete

### 3.5 Organization Service

- [ ] Create `src/services/organization.service.ts`
- [ ] Implement `createOrganization(data)` method
- [ ] Implement `findOrganizationById(id)` method
- [ ] Implement `listOrganizations(filters, pagination)` method
- [ ] Implement `updateOrganization(id, data)` method
- [ ] Implement `deleteOrganization(id)` method
- [ ] Implement private `transformOrganization(model)` method
- [ ] Add event publishing on create/update/delete

### 3.6 Hub Service

- [ ] Create `src/services/hub.service.ts`
- [ ] Implement `createSubscription(callback, query)` method
- [ ] Implement `findSubscriptionById(id)` method
- [ ] Implement `deleteSubscription(id)` method

### 3.7 Routes

- [ ] Create `src/routes/individual.ts`
- [ ] Implement `GET /individual` - list individuals
- [ ] Implement `GET /individual/:id` - get individual by id
- [ ] Implement `POST /individual` - create individual
- [ ] Implement `PATCH /individual/:id` - update individual
- [ ] Implement `DELETE /individual/:id` - delete individual

- [ ] Create `src/routes/organization.ts`
- [ ] Implement `GET /organization` - list organizations
- [ ] Implement `GET /organization/:id` - get organization by id
- [ ] Implement `POST /organization` - create organization
- [ ] Implement `PATCH /organization/:id` - update organization
- [ ] Implement `DELETE /organization/:id` - delete organization

- [ ] Create `src/routes/hub.ts`
- [ ] Implement `POST /hub` - create subscription
- [ ] Implement `DELETE /hub/:id` - delete subscription

### 3.8 Wire Up App

- [ ] Register all routes in `src/index.ts`
- [ ] Apply middleware (error handler, request id, etc.)
- [ ] Set base path `/tmf-api/partyManagement/v4`
- [ ] Create `Dockerfile`
- [ ] Test app starts and responds to requests

### 3.9 Integration Tests

- [ ] Create `tests/setup.ts` with test database helpers
- [ ] Create `tests/individual.test.ts`
- [ ] Test POST /individual creates individual
- [ ] Test GET /individual/:id returns individual
- [ ] Test GET /individual returns list with pagination
- [ ] Test GET /individual with ?fields= returns partial response
- [ ] Test PATCH /individual/:id updates individual
- [ ] Test DELETE /individual/:id removes individual
- [ ] Test 404 for non-existent individual

- [ ] Create `tests/organization.test.ts`
- [ ] Test POST /organization creates organization
- [ ] Test GET /organization/:id returns organization
- [ ] Test GET /organization returns list with pagination
- [ ] Test GET /organization with ?fields= returns partial response
- [ ] Test PATCH /organization/:id updates organization
- [ ] Test DELETE /organization/:id removes organization
- [ ] Test 404 for non-existent organization

- [ ] Create `tests/hub.test.ts`
- [ ] Test POST /hub creates subscription
- [ ] Test DELETE /hub/:id removes subscription

### 3.10 OpenAPI Specification

- [ ] Create `openapi.yaml` in service root
- [ ] Define info section (title, version, description)
- [ ] Define server URLs
- [ ] Reference shared parameters from @tm-forum/shared
- [ ] Reference shared responses from @tm-forum/shared
- [ ] Define Individual schema with all fields
- [ ] Define IndividualCreate schema (writable fields only)
- [ ] Define IndividualUpdate schema
- [ ] Define Organization schema with all fields
- [ ] Define OrganizationCreate schema
- [ ] Define OrganizationUpdate schema
- [ ] Define HubSubscription schema
- [ ] Document all /individual endpoints with examples
- [ ] Document all /organization endpoints with examples
- [ ] Document all /hub endpoints with examples
- [ ] Add route to serve OpenAPI spec at `GET /openapi.yaml`
- [ ] Validate spec with OpenAPI linter

---

## Phase 4: TMF673 Geographic Address API

### 4.1 Project Setup

- [ ] Initialize `apps/tmf673-geographic-address` with `package.json`
- [ ] Create `tsconfig.json` extending base config
- [ ] Add dependencies
- [ ] Create `drizzle.config.ts`
- [ ] Create `src/index.ts` with Hono app entry point
- [ ] Create `src/db/client.ts` with database connection

### 4.2 Database Schema

- [ ] Create `src/db/schema.ts`
- [ ] Define `geographic_addresses` table
- [ ] Define `geographic_sub_addresses` table
- [ ] Define `event_subscriptions` table
- [ ] Generate initial migration
- [ ] Test migration runs successfully

### 4.3 Types

- [ ] Create `src/types/index.ts`
- [ ] Define `GeographicAddressDto` interface
- [ ] Define `GeographicSubAddressDto` interface
- [ ] Define request interfaces for create/update

### 4.4 Services

- [ ] Create `src/services/geographic-address.service.ts`
- [ ] Implement CRUD methods for GeographicAddress
- [ ] Add event publishing

- [ ] Create `src/services/geographic-sub-address.service.ts`
- [ ] Implement CRUD methods for GeographicSubAddress
- [ ] Add event publishing

- [ ] Create `src/services/hub.service.ts`

### 4.5 Routes

- [ ] Create `src/routes/geographic-address.ts`
- [ ] Implement all CRUD endpoints

- [ ] Create `src/routes/geographic-sub-address.ts`
- [ ] Implement all CRUD endpoints

- [ ] Create `src/routes/hub.ts`

### 4.6 Wire Up App

- [ ] Register all routes in `src/index.ts`
- [ ] Apply middleware
- [ ] Set base path `/tmf-api/geographicAddressManagement/v4`
- [ ] Create `Dockerfile`

### 4.7 Integration Tests

- [ ] Create `tests/geographic-address.test.ts`
- [ ] Test all CRUD operations
- [ ] Test field filtering and pagination
- [ ] Test error scenarios

- [ ] Create `tests/geographic-sub-address.test.ts`
- [ ] Test all CRUD operations
- [ ] Test relationship with parent address

- [ ] Create `tests/hub.test.ts`

### 4.8 OpenAPI Specification

- [ ] Create `openapi.yaml` in service root
- [ ] Define info section (title, version, description)
- [ ] Define server URLs
- [ ] Reference shared components from @tm-forum/shared
- [ ] Define GeographicAddress schema with all fields
- [ ] Define GeographicAddressCreate schema
- [ ] Define GeographicAddressUpdate schema
- [ ] Define GeographicSubAddress schema with all fields
- [ ] Define GeographicSubAddressCreate schema
- [ ] Define GeographicSubAddressUpdate schema
- [ ] Define HubSubscription schema
- [ ] Document all /geographicAddress endpoints with examples
- [ ] Document all /geographicSubAddress endpoints with examples
- [ ] Document all /hub endpoints with examples
- [ ] Add route to serve OpenAPI spec at `GET /openapi.yaml`
- [ ] Validate spec with OpenAPI linter

---

## Phase 5: TMF629 Customer Management API

### 5.1 Project Setup

- [ ] Initialize `apps/tmf629-customer` with `package.json`
- [ ] Create `tsconfig.json` extending base config
- [ ] Add dependencies
- [ ] Create `drizzle.config.ts`
- [ ] Create `src/index.ts` with Hono app entry point
- [ ] Create `src/db/client.ts` with database connection

### 5.2 Database Schema

- [ ] Create `src/db/schema.ts`
- [ ] Define `customers` table
- [ ] Define `customer_characteristics` table
- [ ] Define `customer_contact_mediums` table
- [ ] Define `customer_related_parties` table
- [ ] Define `event_subscriptions` table
- [ ] Generate initial migration
- [ ] Test migration runs successfully

### 5.3 Types

- [ ] Create `src/types/index.ts`
- [ ] Define `CustomerDto` interface
- [ ] Define request interfaces for create/update

### 5.4 Party Client (Cross-Service)

- [ ] Create `src/clients/party.client.ts`
- [ ] Implement `findPartyById(id)` method that calls TMF632
- [ ] Implement `validatePartyExists(id)` method
- [ ] Handle connection errors gracefully
- [ ] Make TMF632 base URL configurable via env var

### 5.5 Services

- [ ] Create `src/services/customer.service.ts`
- [ ] Implement `createCustomer(data)` method
- [ ] Add validation that engagedParty exists via party client
- [ ] Implement `findCustomerById(id)` method
- [ ] Implement `listCustomers(filters, pagination)` method
- [ ] Implement `updateCustomer(id, data)` method
- [ ] Implement `deleteCustomer(id)` method
- [ ] Add event publishing

- [ ] Create `src/services/hub.service.ts`

### 5.6 Routes

- [ ] Create `src/routes/customer.ts`
- [ ] Implement all CRUD endpoints

- [ ] Create `src/routes/hub.ts`

### 5.7 Wire Up App

- [ ] Register all routes in `src/index.ts`
- [ ] Apply middleware
- [ ] Set base path `/tmf-api/customerManagement/v4`
- [ ] Create `Dockerfile`

### 5.8 Integration Tests

- [ ] Create `tests/customer.test.ts`
- [ ] Test all CRUD operations
- [ ] Test engagedParty validation (mock party client or run TMF632)
- [ ] Test field filtering and pagination
- [ ] Test error scenarios

- [ ] Create `tests/hub.test.ts`

### 5.9 OpenAPI Specification

- [ ] Create `openapi.yaml` in service root
- [ ] Define info section (title, version, description)
- [ ] Define server URLs
- [ ] Reference shared components from @tm-forum/shared
- [ ] Define Customer schema with all fields
- [ ] Define CustomerCreate schema
- [ ] Define CustomerUpdate schema
- [ ] Define HubSubscription schema
- [ ] Document engagedParty relationship to TMF632 Party
- [ ] Document all /customer endpoints with examples
- [ ] Document all /hub endpoints with examples
- [ ] Add route to serve OpenAPI spec at `GET /openapi.yaml`
- [ ] Validate spec with OpenAPI linter

---

## Phase 6: TMF620 Product Catalog API

### 6.1 Project Setup

- [ ] Initialize `apps/tmf620-product-catalog` with `package.json`
- [ ] Create `tsconfig.json` extending base config
- [ ] Add dependencies
- [ ] Create `drizzle.config.ts`
- [ ] Create `src/index.ts` with Hono app entry point
- [ ] Create `src/db/client.ts` with database connection

### 6.2 Database Schema

- [ ] Create `src/db/schema.ts`
- [ ] Define `catalogs` table
- [ ] Define `categories` table (with self-referential parent_id)
- [ ] Define `product_offerings` table
- [ ] Define `product_specifications` table
- [ ] Define `product_spec_characteristics` table
- [ ] Define join tables (catalog_categories, product_offering_categories)
- [ ] Define `catalog_related_parties` table
- [ ] Define `event_subscriptions` table
- [ ] Generate initial migration
- [ ] Test migration runs successfully

### 6.3 Types

- [ ] Create `src/types/index.ts`
- [ ] Define `CatalogDto` interface
- [ ] Define `CategoryDto` interface
- [ ] Define `ProductOfferingDto` interface
- [ ] Define `ProductSpecificationDto` interface
- [ ] Define request interfaces for all entities

### 6.4 Services

- [ ] Create `src/services/catalog.service.ts`
- [ ] Implement CRUD methods
- [ ] Add event publishing

- [ ] Create `src/services/category.service.ts`
- [ ] Implement CRUD methods
- [ ] Handle parent/child relationships
- [ ] Add event publishing

- [ ] Create `src/services/product-offering.service.ts`
- [ ] Implement CRUD methods
- [ ] Handle category relationships
- [ ] Handle product specification relationship
- [ ] Add event publishing

- [ ] Create `src/services/product-specification.service.ts`
- [ ] Implement CRUD methods
- [ ] Handle characteristics
- [ ] Add event publishing

- [ ] Create `src/services/hub.service.ts`

### 6.5 Routes

- [ ] Create `src/routes/catalog.ts`
- [ ] Implement all CRUD endpoints

- [ ] Create `src/routes/category.ts`
- [ ] Implement all CRUD endpoints

- [ ] Create `src/routes/product-offering.ts`
- [ ] Implement all CRUD endpoints

- [ ] Create `src/routes/product-specification.ts`
- [ ] Implement all CRUD endpoints

- [ ] Create `src/routes/hub.ts`

### 6.6 Wire Up App

- [ ] Register all routes in `src/index.ts`
- [ ] Apply middleware
- [ ] Set base path `/tmf-api/productCatalogManagement/v4`
- [ ] Create `Dockerfile`

### 6.7 Integration Tests

- [ ] Create `tests/catalog.test.ts`
- [ ] Test all CRUD operations

- [ ] Create `tests/category.test.ts`
- [ ] Test all CRUD operations
- [ ] Test parent/child hierarchy

- [ ] Create `tests/product-offering.test.ts`
- [ ] Test all CRUD operations
- [ ] Test category assignment
- [ ] Test product specification linkage

- [ ] Create `tests/product-specification.test.ts`
- [ ] Test all CRUD operations
- [ ] Test characteristics management

- [ ] Create `tests/hub.test.ts`

### 6.8 OpenAPI Specification

- [ ] Create `openapi.yaml` in service root
- [ ] Define info section (title, version, description)
- [ ] Define server URLs
- [ ] Reference shared components from @tm-forum/shared
- [ ] Define Catalog schema with all fields
- [ ] Define CatalogCreate and CatalogUpdate schemas
- [ ] Define Category schema with all fields
- [ ] Define CategoryCreate and CategoryUpdate schemas
- [ ] Define ProductOffering schema with all fields
- [ ] Define ProductOfferingCreate and ProductOfferingUpdate schemas
- [ ] Define ProductSpecification schema with all fields
- [ ] Define ProductSpecificationCreate and ProductSpecificationUpdate schemas
- [ ] Define ProductSpecCharacteristic schema
- [ ] Define HubSubscription schema
- [ ] Document all /catalog endpoints with examples
- [ ] Document all /category endpoints with examples
- [ ] Document all /productOffering endpoints with examples
- [ ] Document all /productSpecification endpoints with examples
- [ ] Document all /hub endpoints with examples
- [ ] Add route to serve OpenAPI spec at `GET /openapi.yaml`
- [ ] Validate spec with OpenAPI linter

---

## Phase 7: Event System Integration

### 7.1 Event Publishing

- [ ] Verify all services publish events to Redis
- [ ] Test event format matches TMF688 specification
- [ ] Add correlation ID support across services

### 7.2 Hub Callback Delivery

- [ ] Implement callback delivery in hub manager
- [ ] Add retry logic for failed callbacks
- [ ] Add logging for callback delivery
- [ ] Test callback delivery works end-to-end

### 7.3 Cross-Service Events

- [ ] Test TMF629 receives events when Party is updated
- [ ] Document event flow between services

---

## Phase 8: Docker & Deployment

### 8.1 Docker Compose Full Stack

- [ ] Update `docker-compose.yml` to include all 4 services
- [ ] Configure service dependencies (wait for postgres/redis)
- [ ] Configure inter-service networking
- [ ] Test `docker compose up` starts entire stack
- [ ] Test services can communicate with each other

### 8.2 Production Readiness

- [ ] Add health check endpoints to all services (`/health`)
- [ ] Add graceful shutdown handling
- [ ] Configure logging (structured JSON)
- [ ] Document environment variables

---

## Phase 9: Documentation

### 9.1 README

- [ ] Write project overview
- [ ] Document prerequisites (Bun, Docker)
- [ ] Document setup instructions
- [ ] Document available commands (dev, test, build)
- [ ] Document Docker usage
- [ ] Document API endpoints summary

### 9.2 API Documentation

- [ ] Verify all OpenAPI specs are complete and valid
- [ ] Test that each service serves its OpenAPI spec at `GET /openapi.yaml`
- [ ] Add example requests/responses to SPEC.md or separate docs
- [ ] Consider adding Swagger UI or Redoc for interactive documentation

### 9.3 Architecture Documentation

- [ ] Create architecture diagram
- [ ] Document cross-service communication
- [ ] Document event flows

---

## Verification Checklist

Before considering the project complete, verify:

- [ ] All services start without errors
- [ ] All integration tests pass
- [ ] Docker Compose starts full stack
- [ ] Services can communicate (TMF629 → TMF632)
- [ ] Events are published to Redis
- [ ] Hub subscriptions receive callbacks
- [ ] Field filtering works on all GET endpoints
- [ ] Pagination works on all list endpoints
- [ ] Error responses follow TM Forum format
- [ ] Code follows project conventions (no semicolons, etc.)
- [ ] All OpenAPI specs are valid (pass linting)
- [ ] All services serve OpenAPI spec at `GET /openapi.yaml`
- [ ] OpenAPI schemas match actual request/response formats
