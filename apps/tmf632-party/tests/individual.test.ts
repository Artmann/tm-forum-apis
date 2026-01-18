import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { createApp } from '../src/index'
import { setupTestDatabase, type TestContext } from './setup'

describe('Individual API', () => {
  let testCtx: TestContext
  let app: ReturnType<typeof createApp>

  beforeAll(async () => {
    testCtx = await setupTestDatabase()
    app = createApp(testCtx.db as any, 'http://localhost:3632')
  })

  afterAll(async () => {
    await testCtx.cleanup()
  })

  describe('POST /individual', () => {
    it('should create an individual', async () => {
      const payload = {
        givenName: 'John',
        familyName: 'Doe',
        gender: 'male'
      }

      const res = await app.request(
        '/tmf-api/partyManagement/v4/individual',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      )

      expect(res.status).toEqual(201)
      const body = await res.json()
      expect(body.id).toBeDefined()
      expect(body.href).toContain('/individual/')
      expect(body.givenName).toEqual('John')
      expect(body.familyName).toEqual('Doe')
      expect(body.gender).toEqual('male')
      expect(body['@type']).toEqual('Individual')
    })
  })

  describe('GET /individual/:id', () => {
    it('should return an individual by id', async () => {
      const createRes = await app.request(
        '/tmf-api/partyManagement/v4/individual',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ givenName: 'Jane', familyName: 'Smith' })
        }
      )
      const created = await createRes.json()

      const res = await app.request(
        `/tmf-api/partyManagement/v4/individual/${created.id}`
      )

      expect(res.status).toEqual(200)
      const body = await res.json()
      expect(body.id).toEqual(created.id)
      expect(body.givenName).toEqual('Jane')
      expect(body.familyName).toEqual('Smith')
    })

    it('should return 404 for non-existent individual', async () => {
      const res = await app.request(
        '/tmf-api/partyManagement/v4/individual/00000000-0000-0000-0000-000000000000'
      )

      expect(res.status).toEqual(404)
      const body = await res.json()
      expect(body.code).toEqual('60')
      expect(body.reason).toEqual('Not Found')
    })
  })

  describe('GET /individual', () => {
    it('should return list of individuals', async () => {
      const res = await app.request('/tmf-api/partyManagement/v4/individual')

      expect(res.status).toEqual(200)
      const body = await res.json()
      expect(Array.isArray(body)).toBe(true)
      expect(res.headers.get('X-Total-Count')).toBeDefined()
    })

    it('should support pagination', async () => {
      const res = await app.request(
        '/tmf-api/partyManagement/v4/individual?offset=0&limit=1'
      )

      expect(res.status).toEqual(200)
      const body = await res.json()
      expect(Array.isArray(body)).toBe(true)
      expect(body.length).toBeLessThanOrEqual(1)
    })

    it('should support field filtering', async () => {
      await app.request('/tmf-api/partyManagement/v4/individual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ givenName: 'Filter', familyName: 'Test' })
      })

      const res = await app.request(
        '/tmf-api/partyManagement/v4/individual?fields=id,givenName'
      )

      expect(res.status).toEqual(200)
      const body = await res.json()
      expect(Array.isArray(body)).toBe(true)
      if (body.length > 0) {
        expect(body[0].id).toBeDefined()
        expect(body[0].givenName).toBeDefined()
        expect(body[0].familyName).toBeUndefined()
      }
    })
  })

  describe('PATCH /individual/:id', () => {
    it('should update an individual', async () => {
      const createRes = await app.request(
        '/tmf-api/partyManagement/v4/individual',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ givenName: 'Original', familyName: 'Name' })
        }
      )
      const created = await createRes.json()

      const res = await app.request(
        `/tmf-api/partyManagement/v4/individual/${created.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ givenName: 'Updated' })
        }
      )

      expect(res.status).toEqual(200)
      const body = await res.json()
      expect(body.givenName).toEqual('Updated')
      expect(body.familyName).toEqual('Name')
    })
  })

  describe('DELETE /individual/:id', () => {
    it('should delete an individual', async () => {
      const createRes = await app.request(
        '/tmf-api/partyManagement/v4/individual',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ givenName: 'ToDelete', familyName: 'Person' })
        }
      )
      const created = await createRes.json()

      const deleteRes = await app.request(
        `/tmf-api/partyManagement/v4/individual/${created.id}`,
        { method: 'DELETE' }
      )

      expect(deleteRes.status).toEqual(204)

      const getRes = await app.request(
        `/tmf-api/partyManagement/v4/individual/${created.id}`
      )
      expect(getRes.status).toEqual(404)
    })
  })
})
