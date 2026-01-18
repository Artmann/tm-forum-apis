import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { createApp } from '../src/index'
import { setupTestDatabase, type TestContext } from './setup'

describe('Organization API', () => {
  let testCtx: TestContext
  let app: ReturnType<typeof createApp>

  beforeAll(async () => {
    testCtx = await setupTestDatabase()
    app = createApp(testCtx.db as any, 'http://localhost:3632')
  })

  afterAll(async () => {
    await testCtx.cleanup()
  })

  describe('POST /organization', () => {
    it('should create an organization', async () => {
      const payload = {
        name: 'Acme Corp',
        tradingName: 'Acme',
        isLegalEntity: true
      }

      const res = await app.request(
        '/tmf-api/partyManagement/v4/organization',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      )

      expect(res.status).toEqual(201)
      const body = await res.json()
      expect(body.id).toBeDefined()
      expect(body.href).toContain('/organization/')
      expect(body.name).toEqual('Acme Corp')
      expect(body.tradingName).toEqual('Acme')
      expect(body.isLegalEntity).toBe(true)
      expect(body['@type']).toEqual('Organization')
    })
  })

  describe('GET /organization/:id', () => {
    it('should return an organization by id', async () => {
      const createRes = await app.request(
        '/tmf-api/partyManagement/v4/organization',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Test Org' })
        }
      )
      const created = await createRes.json()

      const res = await app.request(
        `/tmf-api/partyManagement/v4/organization/${created.id}`
      )

      expect(res.status).toEqual(200)
      const body = await res.json()
      expect(body.id).toEqual(created.id)
      expect(body.name).toEqual('Test Org')
    })

    it('should return 404 for non-existent organization', async () => {
      const res = await app.request(
        '/tmf-api/partyManagement/v4/organization/00000000-0000-0000-0000-000000000000'
      )

      expect(res.status).toEqual(404)
      const body = await res.json()
      expect(body.code).toEqual('60')
      expect(body.reason).toEqual('Not Found')
    })
  })

  describe('GET /organization', () => {
    it('should return list of organizations', async () => {
      const res = await app.request('/tmf-api/partyManagement/v4/organization')

      expect(res.status).toEqual(200)
      const body = await res.json()
      expect(Array.isArray(body)).toBe(true)
      expect(res.headers.get('X-Total-Count')).toBeDefined()
    })

    it('should support pagination', async () => {
      const res = await app.request(
        '/tmf-api/partyManagement/v4/organization?offset=0&limit=1'
      )

      expect(res.status).toEqual(200)
      const body = await res.json()
      expect(Array.isArray(body)).toBe(true)
      expect(body.length).toBeLessThanOrEqual(1)
    })

    it('should support field filtering', async () => {
      await app.request('/tmf-api/partyManagement/v4/organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Filter Org', tradingName: 'FOT' })
      })

      const res = await app.request(
        '/tmf-api/partyManagement/v4/organization?fields=id,name'
      )

      expect(res.status).toEqual(200)
      const body = await res.json()
      expect(Array.isArray(body)).toBe(true)
      if (body.length > 0) {
        expect(body[0].id).toBeDefined()
        expect(body[0].name).toBeDefined()
        expect(body[0].tradingName).toBeUndefined()
      }
    })
  })

  describe('PATCH /organization/:id', () => {
    it('should update an organization', async () => {
      const createRes = await app.request(
        '/tmf-api/partyManagement/v4/organization',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Original Org' })
        }
      )
      const created = await createRes.json()

      const res = await app.request(
        `/tmf-api/partyManagement/v4/organization/${created.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Updated Org' })
        }
      )

      expect(res.status).toEqual(200)
      const body = await res.json()
      expect(body.name).toEqual('Updated Org')
    })
  })

  describe('DELETE /organization/:id', () => {
    it('should delete an organization', async () => {
      const createRes = await app.request(
        '/tmf-api/partyManagement/v4/organization',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'To Delete Org' })
        }
      )
      const created = await createRes.json()

      const deleteRes = await app.request(
        `/tmf-api/partyManagement/v4/organization/${created.id}`,
        { method: 'DELETE' }
      )

      expect(deleteRes.status).toEqual(204)

      const getRes = await app.request(
        `/tmf-api/partyManagement/v4/organization/${created.id}`
      )
      expect(getRes.status).toEqual(404)
    })
  })
})
