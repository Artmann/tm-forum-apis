import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { createApp } from '../src/index'
import { setupTestDatabase, type TestContext } from './setup'

describe('Catalog API', () => {
  let testCtx: TestContext
  let app: ReturnType<typeof createApp>

  beforeAll(async () => {
    testCtx = await setupTestDatabase()
    app = createApp(testCtx.db as any, 'http://localhost:3620')
  })

  afterAll(async () => {
    await testCtx.cleanup()
  })

  describe('POST /catalog', () => {
    it('should create a catalog', async () => {
      const payload = {
        name: 'Mobile Products',
        description: 'Catalog for mobile products',
        catalogType: 'ProductCatalog',
        lifecycleStatus: 'active'
      }

      const res = await app.request(
        '/tmf-api/productCatalogManagement/v4/catalog',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      )

      expect(res.status).toEqual(201)
      const body = await res.json()
      expect(body.id).toBeDefined()
      expect(body.href).toContain('/catalog/')
      expect(body.name).toEqual('Mobile Products')
      expect(body.catalogType).toEqual('ProductCatalog')
      expect(body['@type']).toEqual('Catalog')
    })
  })

  describe('GET /catalog/:id', () => {
    it('should return a catalog by id', async () => {
      const createRes = await app.request(
        '/tmf-api/productCatalogManagement/v4/catalog',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Test Catalog' })
        }
      )
      const created = await createRes.json()

      const res = await app.request(
        `/tmf-api/productCatalogManagement/v4/catalog/${created.id}`
      )

      expect(res.status).toEqual(200)
      const body = await res.json()
      expect(body.id).toEqual(created.id)
      expect(body.name).toEqual('Test Catalog')
    })

    it('should return 404 for non-existent catalog', async () => {
      const res = await app.request(
        '/tmf-api/productCatalogManagement/v4/catalog/00000000-0000-0000-0000-000000000000'
      )

      expect(res.status).toEqual(404)
    })
  })

  describe('GET /catalog', () => {
    it('should return list of catalogs', async () => {
      const res = await app.request('/tmf-api/productCatalogManagement/v4/catalog')

      expect(res.status).toEqual(200)
      const body = await res.json()
      expect(Array.isArray(body)).toBe(true)
      expect(res.headers.get('X-Total-Count')).toBeDefined()
    })
  })

  describe('PATCH /catalog/:id', () => {
    it('should update a catalog', async () => {
      const createRes = await app.request(
        '/tmf-api/productCatalogManagement/v4/catalog',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Original Catalog' })
        }
      )
      const created = await createRes.json()

      const res = await app.request(
        `/tmf-api/productCatalogManagement/v4/catalog/${created.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Updated Catalog' })
        }
      )

      expect(res.status).toEqual(200)
      const body = await res.json()
      expect(body.name).toEqual('Updated Catalog')
    })
  })

  describe('DELETE /catalog/:id', () => {
    it('should delete a catalog', async () => {
      const createRes = await app.request(
        '/tmf-api/productCatalogManagement/v4/catalog',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'To Delete Catalog' })
        }
      )
      const created = await createRes.json()

      const deleteRes = await app.request(
        `/tmf-api/productCatalogManagement/v4/catalog/${created.id}`,
        { method: 'DELETE' }
      )

      expect(deleteRes.status).toEqual(204)
    })
  })
})
