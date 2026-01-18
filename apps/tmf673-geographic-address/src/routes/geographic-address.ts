import { Hono } from 'hono'
import { NotFoundError, getPagination } from '@tm-forum/tmf-common'
import { GeographicAddressService } from '../services/geographic-address.service'

export function createGeographicAddressRoutes(database: any, baseUrl: string) {
  const router = new Hono()
  const service = new GeographicAddressService(database, baseUrl)

  router.post('/', async (c) => {
    const body = await c.req.json()
    const address = await service.createGeographicAddress(body)
    return c.json(address, 201)
  })

  router.get('/:id', async (c) => {
    const id = c.req.param('id')
    const address = await service.findGeographicAddressById(id)

    if (!address) {
      throw new NotFoundError(`GeographicAddress with id ${id} not found`)
    }

    return c.json(address)
  })

  router.get('/', async (c) => {
    const pagination = getPagination(c)
    const { items, totalCount } = await service.listGeographicAddresses(pagination)

    c.header('X-Total-Count', totalCount.toString())
    c.header('X-Result-Count', items.length.toString())

    return c.json(items)
  })

  router.patch('/:id', async (c) => {
    const id = c.req.param('id')
    const body = await c.req.json()
    const address = await service.updateGeographicAddress(id, body)

    if (!address) {
      throw new NotFoundError(`GeographicAddress with id ${id} not found`)
    }

    return c.json(address)
  })

  router.delete('/:id', async (c) => {
    const id = c.req.param('id')
    const deleted = await service.deleteGeographicAddress(id)

    if (!deleted) {
      throw new NotFoundError(`GeographicAddress with id ${id} not found`)
    }

    return c.body(null, 204)
  })

  return router
}
