import { Hono } from 'hono'
import { NotFoundError, getPagination } from '@tm-forum/tmf-common'
import { ProductOfferingService } from '../services/product-offering.service'

export function createProductOfferingRoutes(database: any, baseUrl: string) {
  const router = new Hono()
  const service = new ProductOfferingService(database, baseUrl)

  router.post('/', async (c) => {
    const body = await c.req.json()
    const offering = await service.createProductOffering(body)
    return c.json(offering, 201)
  })

  router.get('/:id', async (c) => {
    const id = c.req.param('id')
    const offering = await service.findProductOfferingById(id)

    if (!offering) {
      throw new NotFoundError(`ProductOffering with id ${id} not found`)
    }

    return c.json(offering)
  })

  router.get('/', async (c) => {
    const pagination = getPagination(c)
    const { items, totalCount } = await service.listProductOfferings(pagination)

    c.header('X-Total-Count', totalCount.toString())
    c.header('X-Result-Count', items.length.toString())

    return c.json(items)
  })

  router.patch('/:id', async (c) => {
    const id = c.req.param('id')
    const body = await c.req.json()
    const offering = await service.updateProductOffering(id, body)

    if (!offering) {
      throw new NotFoundError(`ProductOffering with id ${id} not found`)
    }

    return c.json(offering)
  })

  router.delete('/:id', async (c) => {
    const id = c.req.param('id')
    const deleted = await service.deleteProductOffering(id)

    if (!deleted) {
      throw new NotFoundError(`ProductOffering with id ${id} not found`)
    }

    return c.body(null, 204)
  })

  return router
}
