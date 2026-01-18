import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { createApp } from '../src/index'
import { setupTestDatabase, type TestContext } from './setup'

describe('Customer API', () => {
  let testCtx: TestContext
  let app: ReturnType<typeof createApp>

  beforeAll(async () => {
    testCtx = await setupTestDatabase()
    app = createApp(testCtx.db as any, 'http://localhost:3629')
  })

  afterAll(async () => {
    await testCtx.cleanup()
  })

  describe('POST /customer', () => {
    it('should create a customer', async () => {
      const payload = {
        name: 'Acme Corp Customer',
        status: 'active',
        engagedParty: {
          id: 'party-123',
          name: 'Acme Corp',
          '@referredType': 'Organization'
        }
      }

      const res = await app.request('/tmf-api/customerManagement/v4/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      expect(res.status).toEqual(201)
      const body = await res.json()
      expect(body.id).toBeDefined()
      expect(body.href).toContain('/customer/')
      expect(body.name).toEqual('Acme Corp Customer')
      expect(body.status).toEqual('active')
      expect(body.engagedParty).toBeDefined()
      expect(body.engagedParty.id).toEqual('party-123')
      expect(body.engagedParty['@referredType']).toEqual('Organization')
      expect(body['@type']).toEqual('Customer')
    })

    it('should create a customer with characteristics', async () => {
      const payload = {
        name: 'Premium Customer',
        engagedParty: {
          id: 'party-456',
          '@referredType': 'Individual'
        },
        characteristic: [
          {
            name: 'loyaltyLevel',
            value: 'gold',
            valueType: 'string'
          }
        ]
      }

      const res = await app.request('/tmf-api/customerManagement/v4/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      expect(res.status).toEqual(201)
      const body = await res.json()
      expect(body.characteristic).toBeDefined()
      expect(body.characteristic.length).toEqual(1)
      expect(body.characteristic[0].name).toEqual('loyaltyLevel')
      expect(body.characteristic[0].value).toEqual('gold')
    })
  })

  describe('GET /customer/:id', () => {
    it('should return a customer by id', async () => {
      const createRes = await app.request(
        '/tmf-api/customerManagement/v4/customer',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test Customer',
            engagedParty: {
              id: 'party-789',
              '@referredType': 'Organization'
            }
          })
        }
      )
      const created = await createRes.json()

      const res = await app.request(
        `/tmf-api/customerManagement/v4/customer/${created.id}`
      )

      expect(res.status).toEqual(200)
      const body = await res.json()
      expect(body.id).toEqual(created.id)
      expect(body.name).toEqual('Test Customer')
    })

    it('should return 404 for non-existent customer', async () => {
      const res = await app.request(
        '/tmf-api/customerManagement/v4/customer/00000000-0000-0000-0000-000000000000'
      )

      expect(res.status).toEqual(404)
      const body = await res.json()
      expect(body.code).toEqual('60')
      expect(body.reason).toEqual('Not Found')
    })
  })

  describe('GET /customer', () => {
    it('should return list of customers', async () => {
      const res = await app.request('/tmf-api/customerManagement/v4/customer')

      expect(res.status).toEqual(200)
      const body = await res.json()
      expect(Array.isArray(body)).toBe(true)
      expect(res.headers.get('X-Total-Count')).toBeDefined()
    })

    it('should support pagination', async () => {
      const res = await app.request(
        '/tmf-api/customerManagement/v4/customer?offset=0&limit=1'
      )

      expect(res.status).toEqual(200)
      const body = await res.json()
      expect(Array.isArray(body)).toBe(true)
      expect(body.length).toBeLessThanOrEqual(1)
    })

    it('should support field filtering', async () => {
      await app.request('/tmf-api/customerManagement/v4/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Filter Customer',
          status: 'active',
          engagedParty: {
            id: 'party-filter',
            '@referredType': 'Organization'
          }
        })
      })

      const res = await app.request(
        '/tmf-api/customerManagement/v4/customer?fields=id,name'
      )

      expect(res.status).toEqual(200)
      const body = await res.json()
      expect(Array.isArray(body)).toBe(true)
      if (body.length > 0) {
        expect(body[0].id).toBeDefined()
        expect(body[0].name).toBeDefined()
        expect(body[0].status).toBeUndefined()
      }
    })
  })

  describe('PATCH /customer/:id', () => {
    it('should update a customer', async () => {
      const createRes = await app.request(
        '/tmf-api/customerManagement/v4/customer',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Original Customer',
            status: 'pending',
            engagedParty: {
              id: 'party-update',
              '@referredType': 'Individual'
            }
          })
        }
      )
      const created = await createRes.json()

      const res = await app.request(
        `/tmf-api/customerManagement/v4/customer/${created.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Updated Customer',
            status: 'active'
          })
        }
      )

      expect(res.status).toEqual(200)
      const body = await res.json()
      expect(body.name).toEqual('Updated Customer')
      expect(body.status).toEqual('active')
    })
  })

  describe('DELETE /customer/:id', () => {
    it('should delete a customer', async () => {
      const createRes = await app.request(
        '/tmf-api/customerManagement/v4/customer',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'To Delete Customer',
            engagedParty: {
              id: 'party-delete',
              '@referredType': 'Organization'
            }
          })
        }
      )
      const created = await createRes.json()

      const deleteRes = await app.request(
        `/tmf-api/customerManagement/v4/customer/${created.id}`,
        { method: 'DELETE' }
      )

      expect(deleteRes.status).toEqual(204)

      const getRes = await app.request(
        `/tmf-api/customerManagement/v4/customer/${created.id}`
      )
      expect(getRes.status).toEqual(404)
    })
  })
})
