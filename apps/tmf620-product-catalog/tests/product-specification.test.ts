import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { createApp } from '../src/index'
import { setupTestDatabase, type TestContext } from './setup'

describe('ProductSpecification API', () => {
  let testCtx: TestContext
  let app: ReturnType<typeof createApp>

  beforeAll(async () => {
    testCtx = await setupTestDatabase()
    app = createApp(testCtx.db as any, 'http://localhost:3620')
  })

  afterAll(async () => {
    await testCtx.cleanup()
  })

  describe('POST /productSpecification', () => {
    it('should create a product specification', async () => {
      const payload = {
        name: 'iPhone 15 Pro Spec',
        brand: 'Apple',
        description: 'Technical specification for iPhone 15 Pro',
        productNumber: 'IPHONE15PRO',
        lifecycleStatus: 'active'
      }

      const res = await app.request(
        '/tmf-api/productCatalogManagement/v4/productSpecification',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      )

      expect(res.status).toEqual(201)
      const body = await res.json()
      expect(body.id).toBeDefined()
      expect(body.href).toContain('/productSpecification/')
      expect(body.name).toEqual('iPhone 15 Pro Spec')
      expect(body.brand).toEqual('Apple')
      expect(body['@type']).toEqual('ProductSpecification')
    })

    it('should create a product specification with characteristics', async () => {
      const payload = {
        name: 'Spec with Chars',
        productSpecCharacteristic: [
          {
            name: 'color',
            description: 'Device color',
            valueType: 'string',
            configurable: true
          }
        ]
      }

      const res = await app.request(
        '/tmf-api/productCatalogManagement/v4/productSpecification',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      )

      expect(res.status).toEqual(201)
      const body = await res.json()
      expect(body.productSpecCharacteristic).toBeDefined()
      expect(body.productSpecCharacteristic.length).toEqual(1)
      expect(body.productSpecCharacteristic[0].name).toEqual('color')
    })
  })

  describe('GET /productSpecification/:id', () => {
    it('should return a product specification by id', async () => {
      const createRes = await app.request(
        '/tmf-api/productCatalogManagement/v4/productSpecification',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Test Spec' })
        }
      )
      const created = await createRes.json()

      const res = await app.request(
        `/tmf-api/productCatalogManagement/v4/productSpecification/${created.id}`
      )

      expect(res.status).toEqual(200)
      const body = await res.json()
      expect(body.id).toEqual(created.id)
      expect(body.name).toEqual('Test Spec')
    })

    it('should return 404 for non-existent product specification', async () => {
      const res = await app.request(
        '/tmf-api/productCatalogManagement/v4/productSpecification/00000000-0000-0000-0000-000000000000'
      )

      expect(res.status).toEqual(404)
    })
  })

  describe('GET /productSpecification', () => {
    it('should return list of product specifications', async () => {
      const res = await app.request(
        '/tmf-api/productCatalogManagement/v4/productSpecification'
      )

      expect(res.status).toEqual(200)
      const body = await res.json()
      expect(Array.isArray(body)).toBe(true)
      expect(res.headers.get('X-Total-Count')).toBeDefined()
    })
  })

  describe('PATCH /productSpecification/:id', () => {
    it('should update a product specification', async () => {
      const createRes = await app.request(
        '/tmf-api/productCatalogManagement/v4/productSpecification',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Original Spec' })
        }
      )
      const created = await createRes.json()

      const res = await app.request(
        `/tmf-api/productCatalogManagement/v4/productSpecification/${created.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Updated Spec' })
        }
      )

      expect(res.status).toEqual(200)
      const body = await res.json()
      expect(body.name).toEqual('Updated Spec')
    })
  })

  describe('DELETE /productSpecification/:id', () => {
    it('should delete a product specification', async () => {
      const createRes = await app.request(
        '/tmf-api/productCatalogManagement/v4/productSpecification',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'To Delete Spec' })
        }
      )
      const created = await createRes.json()

      const deleteRes = await app.request(
        `/tmf-api/productCatalogManagement/v4/productSpecification/${created.id}`,
        { method: 'DELETE' }
      )

      expect(deleteRes.status).toEqual(204)
    })
  })
})
