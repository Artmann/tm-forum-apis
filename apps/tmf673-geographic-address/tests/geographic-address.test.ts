import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { createApp } from '../src/index'
import { setupTestDatabase, type TestContext } from './setup'

describe('GeographicAddress API', () => {
  let testCtx: TestContext
  let app: ReturnType<typeof createApp>

  beforeAll(async () => {
    testCtx = await setupTestDatabase()
    app = createApp(testCtx.db as any, 'http://localhost:3673')
  })

  afterAll(async () => {
    await testCtx.cleanup()
  })

  describe('POST /geographicAddress', () => {
    it('should create a geographic address', async () => {
      const payload = {
        streetNr: '123',
        streetName: 'Main Street',
        city: 'Springfield',
        stateOrProvince: 'IL',
        postcode: '62701',
        country: 'USA'
      }

      const res = await app.request(
        '/tmf-api/geographicAddressManagement/v4/geographicAddress',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      )

      expect(res.status).toEqual(201)
      const body = await res.json()
      expect(body.id).toBeDefined()
      expect(body.href).toContain('/geographicAddress/')
      expect(body.streetNr).toEqual('123')
      expect(body.streetName).toEqual('Main Street')
      expect(body.city).toEqual('Springfield')
      expect(body.stateOrProvince).toEqual('IL')
      expect(body.postcode).toEqual('62701')
      expect(body.country).toEqual('USA')
      expect(body['@type']).toEqual('GeographicAddress')
    })

    it('should create an address with sub-addresses', async () => {
      const payload = {
        streetNr: '456',
        streetName: 'Oak Avenue',
        city: 'Chicago',
        country: 'USA',
        geographicSubAddress: [
          {
            subUnitType: 'Apartment',
            subUnitNumber: '101',
            levelNumber: '1'
          }
        ]
      }

      const res = await app.request(
        '/tmf-api/geographicAddressManagement/v4/geographicAddress',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      )

      expect(res.status).toEqual(201)
      const body = await res.json()
      expect(body.geographicSubAddress).toBeDefined()
      expect(body.geographicSubAddress.length).toEqual(1)
      expect(body.geographicSubAddress[0].subUnitType).toEqual('Apartment')
      expect(body.geographicSubAddress[0].subUnitNumber).toEqual('101')
      expect(body.geographicSubAddress[0]['@type']).toEqual('GeographicSubAddress')
    })
  })

  describe('GET /geographicAddress/:id', () => {
    it('should return a geographic address by id', async () => {
      const createRes = await app.request(
        '/tmf-api/geographicAddressManagement/v4/geographicAddress',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            streetNr: '789',
            streetName: 'Elm Street',
            city: 'Denver'
          })
        }
      )
      const created = await createRes.json()

      const res = await app.request(
        `/tmf-api/geographicAddressManagement/v4/geographicAddress/${created.id}`
      )

      expect(res.status).toEqual(200)
      const body = await res.json()
      expect(body.id).toEqual(created.id)
      expect(body.streetName).toEqual('Elm Street')
      expect(body.city).toEqual('Denver')
    })

    it('should return 404 for non-existent address', async () => {
      const res = await app.request(
        '/tmf-api/geographicAddressManagement/v4/geographicAddress/00000000-0000-0000-0000-000000000000'
      )

      expect(res.status).toEqual(404)
      const body = await res.json()
      expect(body.code).toEqual('60')
      expect(body.reason).toEqual('Not Found')
    })
  })

  describe('GET /geographicAddress', () => {
    it('should return list of geographic addresses', async () => {
      const res = await app.request(
        '/tmf-api/geographicAddressManagement/v4/geographicAddress'
      )

      expect(res.status).toEqual(200)
      const body = await res.json()
      expect(Array.isArray(body)).toBe(true)
      expect(res.headers.get('X-Total-Count')).toBeDefined()
    })

    it('should support pagination', async () => {
      const res = await app.request(
        '/tmf-api/geographicAddressManagement/v4/geographicAddress?offset=0&limit=1'
      )

      expect(res.status).toEqual(200)
      const body = await res.json()
      expect(Array.isArray(body)).toBe(true)
      expect(body.length).toBeLessThanOrEqual(1)
    })

    it('should support field filtering', async () => {
      await app.request(
        '/tmf-api/geographicAddressManagement/v4/geographicAddress',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            streetNr: '111',
            streetName: 'Filter Street',
            city: 'Boston',
            country: 'USA'
          })
        }
      )

      const res = await app.request(
        '/tmf-api/geographicAddressManagement/v4/geographicAddress?fields=id,city'
      )

      expect(res.status).toEqual(200)
      const body = await res.json()
      expect(Array.isArray(body)).toBe(true)
      if (body.length > 0) {
        expect(body[0].id).toBeDefined()
        expect(body[0].city).toBeDefined()
        expect(body[0].country).toBeUndefined()
      }
    })
  })

  describe('PATCH /geographicAddress/:id', () => {
    it('should update a geographic address', async () => {
      const createRes = await app.request(
        '/tmf-api/geographicAddressManagement/v4/geographicAddress',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            streetNr: '222',
            streetName: 'Original Street',
            city: 'Seattle'
          })
        }
      )
      const created = await createRes.json()

      const res = await app.request(
        `/tmf-api/geographicAddressManagement/v4/geographicAddress/${created.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ streetName: 'Updated Street' })
        }
      )

      expect(res.status).toEqual(200)
      const body = await res.json()
      expect(body.streetName).toEqual('Updated Street')
      expect(body.city).toEqual('Seattle')
    })
  })

  describe('DELETE /geographicAddress/:id', () => {
    it('should delete a geographic address', async () => {
      const createRes = await app.request(
        '/tmf-api/geographicAddressManagement/v4/geographicAddress',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            streetNr: '333',
            streetName: 'Delete Street',
            city: 'Portland'
          })
        }
      )
      const created = await createRes.json()

      const deleteRes = await app.request(
        `/tmf-api/geographicAddressManagement/v4/geographicAddress/${created.id}`,
        { method: 'DELETE' }
      )

      expect(deleteRes.status).toEqual(204)

      const getRes = await app.request(
        `/tmf-api/geographicAddressManagement/v4/geographicAddress/${created.id}`
      )
      expect(getRes.status).toEqual(404)
    })
  })
})
