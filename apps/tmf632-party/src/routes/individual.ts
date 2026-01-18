import { Hono } from 'hono'
import { IndividualService } from '../services/individual.service'
import type { Database } from '../db/client'
import { getPagination, sendCreated, sendList, sendNoContent, sendOk } from '@tm-forum/tmf-common'

export function createIndividualRoutes(db: Database, baseUrl: string) {
  const app = new Hono()
  const service = new IndividualService(db, baseUrl)

  app.get('/', async (c) => {
    const pagination = getPagination(c)
    const result = await service.listIndividuals(pagination)
    return sendList(c, result)
  })

  app.get('/:id', async (c) => {
    const id = c.req.param('id')
    const individual = await service.findIndividualById(id)
    return sendOk(c, individual)
  })

  app.post('/', async (c) => {
    const body = await c.req.json()
    const individual = await service.createIndividual(body)
    return sendCreated(c, individual)
  })

  app.patch('/:id', async (c) => {
    const id = c.req.param('id')
    const body = await c.req.json()
    const individual = await service.updateIndividual(id, body)
    return sendOk(c, individual)
  })

  app.delete('/:id', async (c) => {
    const id = c.req.param('id')
    await service.deleteIndividual(id)
    return sendNoContent(c)
  })

  return app
}
