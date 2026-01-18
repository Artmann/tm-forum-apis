import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { createApp } from '../src/index'
import { setupTestDatabase, type TestContext } from './setup'

describe('Category API', () => {
  let testCtx: TestContext
  let app: ReturnType<typeof createApp>

  beforeAll(async () => {
    testCtx = await setupTestDatabase()
    app = createApp(testCtx.db as any, 'http://localhost:3620')
  })

  afterAll(async () => {
    await testCtx.cleanup()
  })

  describe('POST /category', () => {
    it('should create a category', async () => {
      const payload = {
        name: 'Smartphones',
        description: 'Mobile smartphone category',
        isRoot: true,
        lifecycleStatus: 'active'
      }

      const res = await app.request(
        '/tmf-api/productCatalogManagement/v4/category',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      )

      expect(res.status).toEqual(201)
      const body = await res.json()
      expect(body.id).toBeDefined()
      expect(body.href).toContain('/category/')
      expect(body.name).toEqual('Smartphones')
      expect(body.isRoot).toBe(true)
      expect(body['@type']).toEqual('Category')
    })
  })

  describe('GET /category/:id', () => {
    it('should return a category by id', async () => {
      const createRes = await app.request(
        '/tmf-api/productCatalogManagement/v4/category',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Test Category' })
        }
      )
      const created = await createRes.json()

      const res = await app.request(
        `/tmf-api/productCatalogManagement/v4/category/${created.id}`
      )

      expect(res.status).toEqual(200)
      const body = await res.json()
      expect(body.id).toEqual(created.id)
      expect(body.name).toEqual('Test Category')
    })

    it('should return 404 for non-existent category', async () => {
      const res = await app.request(
        '/tmf-api/productCatalogManagement/v4/category/00000000-0000-0000-0000-000000000000'
      )

      expect(res.status).toEqual(404)
    })
  })

  describe('GET /category', () => {
    it('should return list of categories', async () => {
      const res = await app.request('/tmf-api/productCatalogManagement/v4/category')

      expect(res.status).toEqual(200)
      const body = await res.json()
      expect(Array.isArray(body)).toBe(true)
      expect(res.headers.get('X-Total-Count')).toBeDefined()
    })
  })

  describe('PATCH /category/:id', () => {
    it('should update a category', async () => {
      const createRes = await app.request(
        '/tmf-api/productCatalogManagement/v4/category',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Original Category' })
        }
      )
      const created = await createRes.json()

      const res = await app.request(
        `/tmf-api/productCatalogManagement/v4/category/${created.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Updated Category' })
        }
      )

      expect(res.status).toEqual(200)
      const body = await res.json()
      expect(body.name).toEqual('Updated Category')
    })
  })

  describe('DELETE /category/:id', () => {
    it('should delete a category', async () => {
      const createRes = await app.request(
        '/tmf-api/productCatalogManagement/v4/category',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'To Delete Category' })
        }
      )
      const created = await createRes.json()

      const deleteRes = await app.request(
        `/tmf-api/productCatalogManagement/v4/category/${created.id}`,
        { method: 'DELETE' }
      )

      expect(deleteRes.status).toEqual(204)
    })
  })
})
