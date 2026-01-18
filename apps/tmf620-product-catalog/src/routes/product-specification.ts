import { Hono } from 'hono'
import { NotFoundError, getPagination } from '@tm-forum/tmf-common'
import { ProductSpecificationService } from '../services/product-specification.service'

export function createProductSpecificationRoutes(database: any, baseUrl: string) {
  const router = new Hono()
  const service = new ProductSpecificationService(database, baseUrl)

  router.post('/', async (c) => {
    const body = await c.req.json()
    const spec = await service.createProductSpecification(body)
    return c.json(spec, 201)
  })

  router.get('/:id', async (c) => {
    const id = c.req.param('id')
    const spec = await service.findProductSpecificationById(id)

    if (!spec) {
      throw new NotFoundError(`ProductSpecification with id ${id} not found`)
    }

    return c.json(spec)
  })

  router.get('/', async (c) => {
    const pagination = getPagination(c)
    const { items, totalCount } = await service.listProductSpecifications(pagination)

    c.header('X-Total-Count', totalCount.toString())
    c.header('X-Result-Count', items.length.toString())

    return c.json(items)
  })

  router.patch('/:id', async (c) => {
    const id = c.req.param('id')
    const body = await c.req.json()
    const spec = await service.updateProductSpecification(id, body)

    if (!spec) {
      throw new NotFoundError(`ProductSpecification with id ${id} not found`)
    }

    return c.json(spec)
  })

  router.delete('/:id', async (c) => {
    const id = c.req.param('id')
    const deleted = await service.deleteProductSpecification(id)

    if (!deleted) {
      throw new NotFoundError(`ProductSpecification with id ${id} not found`)
    }

    return c.body(null, 204)
  })

  return router
}
