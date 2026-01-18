import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { createApp } from '../src/index'
import { setupTestDatabase, type TestContext } from './setup'

describe('Hub API', () => {
  let testCtx: TestContext
  let app: ReturnType<typeof createApp>

  beforeAll(async () => {
    testCtx = await setupTestDatabase()
    app = createApp(testCtx.db as any, 'http://localhost:3629')
  })

  afterAll(async () => {
    await testCtx.cleanup()
  })

  describe('POST /hub', () => {
    it('should create a subscription', async () => {
      const payload = {
        callback: 'https://example.com/callback',
        query: 'eventType=CustomerCreateEvent'
      }

      const res = await app.request('/tmf-api/customerManagement/v4/hub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      expect(res.status).toEqual(201)
      const body = await res.json()
      expect(body.id).toBeDefined()
      expect(body.callback).toEqual('https://example.com/callback')
      expect(body.query).toEqual('eventType=CustomerCreateEvent')
    })
  })

  describe('DELETE /hub/:id', () => {
    it('should delete a subscription', async () => {
      const createRes = await app.request('/tmf-api/customerManagement/v4/hub', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback: 'https://example.com/to-delete' })
      })
      const created = await createRes.json()

      const deleteRes = await app.request(
        `/tmf-api/customerManagement/v4/hub/${created.id}`,
        { method: 'DELETE' }
      )

      expect(deleteRes.status).toEqual(204)
    })

    it('should return 404 for non-existent subscription', async () => {
      const res = await app.request(
        '/tmf-api/customerManagement/v4/hub/00000000-0000-0000-0000-000000000000',
        { method: 'DELETE' }
      )

      expect(res.status).toEqual(404)
    })
  })
})
