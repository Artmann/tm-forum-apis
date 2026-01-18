import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { createApp } from '../src/index'
import { setupTestDatabase, type TestContext } from './setup'

describe('ProductOffering API', () => {
  let testCtx: TestContext
  let app: ReturnType<typeof createApp>

  beforeAll(async () => {
    testCtx = await setupTestDatabase()
    app = createApp(testCtx.db as any, 'http://localhost:3620')
  })

  afterAll(async () => {
    await testCtx.cleanup()
  })

  describe('POST /productOffering', () => {
    it('should create a product offering', async () => {
      const payload = {
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone with Pro features',
        isBundle: false,
        isSellable: true,
        lifecycleStatus: 'active'
      }

      const res = await app.request(
        '/tmf-api/productCatalogManagement/v4/productOffering',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      )

      expect(res.status).toEqual(201)
      const body = await res.json()
      expect(body.id).toBeDefined()
      expect(body.href).toContain('/productOffering/')
      expect(body.name).toEqual('iPhone 15 Pro')
      expect(body.isSellable).toBe(true)
      expect(body['@type']).toEqual('ProductOffering')
    })
  })

  describe('GET /productOffering/:id', () => {
    it('should return a product offering by id', async () => {
      const createRes = await app.request(
        '/tmf-api/productCatalogManagement/v4/productOffering',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Test Offering' })
        }
      )
      const created = await createRes.json()

      const res = await app.request(
        `/tmf-api/productCatalogManagement/v4/productOffering/${created.id}`
      )

      expect(res.status).toEqual(200)
      const body = await res.json()
      expect(body.id).toEqual(created.id)
      expect(body.name).toEqual('Test Offering')
    })

    it('should return 404 for non-existent product offering', async () => {
      const res = await app.request(
        '/tmf-api/productCatalogManagement/v4/productOffering/00000000-0000-0000-0000-000000000000'
      )

      expect(res.status).toEqual(404)
    })
  })

  describe('GET /productOffering', () => {
    it('should return list of product offerings', async () => {
      const res = await app.request(
        '/tmf-api/productCatalogManagement/v4/productOffering'
      )

      expect(res.status).toEqual(200)
      const body = await res.json()
      expect(Array.isArray(body)).toBe(true)
      expect(res.headers.get('X-Total-Count')).toBeDefined()
    })
  })

  describe('PATCH /productOffering/:id', () => {
    it('should update a product offering', async () => {
      const createRes = await app.request(
        '/tmf-api/productCatalogManagement/v4/productOffering',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Original Offering' })
        }
      )
      const created = await createRes.json()

      const res = await app.request(
        `/tmf-api/productCatalogManagement/v4/productOffering/${created.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Updated Offering' })
        }
      )

      expect(res.status).toEqual(200)
      const body = await res.json()
      expect(body.name).toEqual('Updated Offering')
    })
  })

  describe('DELETE /productOffering/:id', () => {
    it('should delete a product offering', async () => {
      const createRes = await app.request(
        '/tmf-api/productCatalogManagement/v4/productOffering',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'To Delete Offering' })
        }
      )
      const created = await createRes.json()

      const deleteRes = await app.request(
        `/tmf-api/productCatalogManagement/v4/productOffering/${created.id}`,
        { method: 'DELETE' }
      )

      expect(deleteRes.status).toEqual(204)
    })
  })
})
