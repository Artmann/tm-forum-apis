import { Hono } from 'hono'
import { NotFoundError } from '@tm-forum/tmf-common'
import { HubService } from '../services/hub.service'

export function createHubRoutes(database: any) {
  const router = new Hono()
  const service = new HubService(database)

  router.post('/', async (c) => {
    const body = await c.req.json()
    const subscription = await service.createSubscription(body)
    return c.json(subscription, 201)
  })

  router.delete('/:id', async (c) => {
    const id = c.req.param('id')
    const deleted = await service.deleteSubscription(id)

    if (!deleted) {
      throw new NotFoundError(`Subscription with id ${id} not found`)
    }

    return c.body(null, 204)
  })

  return router
}
