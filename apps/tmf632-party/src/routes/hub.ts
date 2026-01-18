import { Hono } from 'hono'
import { HubService } from '../services/hub.service'
import type { Database } from '../db/client'
import { sendCreated, sendNoContent } from '@tm-forum/tmf-common'

export function createHubRoutes(db: Database) {
  const app = new Hono()
  const service = new HubService(db)

  app.post('/', async (c) => {
    const body = await c.req.json()
    const subscription = await service.createSubscription(body)
    return sendCreated(c, subscription)
  })

  app.delete('/:id', async (c) => {
    const id = c.req.param('id')
    await service.deleteSubscription(id)
    return sendNoContent(c)
  })

  return app
}
