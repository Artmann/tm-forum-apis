import { Hono } from 'hono'
import { OrganizationService } from '../services/organization.service'
import type { Database } from '../db/client'
import { getPagination, sendCreated, sendList, sendNoContent, sendOk } from '@tm-forum/tmf-common'

export function createOrganizationRoutes(db: Database, baseUrl: string) {
  const app = new Hono()
  const service = new OrganizationService(db, baseUrl)

  app.get('/', async (c) => {
    const pagination = getPagination(c)
    const result = await service.listOrganizations(pagination)
    return sendList(c, result)
  })

  app.get('/:id', async (c) => {
    const id = c.req.param('id')
    const organization = await service.findOrganizationById(id)
    return sendOk(c, organization)
  })

  app.post('/', async (c) => {
    const body = await c.req.json()
    const organization = await service.createOrganization(body)
    return sendCreated(c, organization)
  })

  app.patch('/:id', async (c) => {
    const id = c.req.param('id')
    const body = await c.req.json()
    const organization = await service.updateOrganization(id, body)
    return sendOk(c, organization)
  })

  app.delete('/:id', async (c) => {
    const id = c.req.param('id')
    await service.deleteOrganization(id)
    return sendNoContent(c)
  })

  return app
}
