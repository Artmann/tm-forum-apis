import { Hono } from 'hono'
import { NotFoundError, getPagination } from '@tm-forum/tmf-common'
import { CatalogService } from '../services/catalog.service'

export function createCatalogRoutes(database: any, baseUrl: string) {
  const router = new Hono()
  const service = new CatalogService(database, baseUrl)

  router.post('/', async (c) => {
    const body = await c.req.json()
    const catalog = await service.createCatalog(body)
    return c.json(catalog, 201)
  })

  router.get('/:id', async (c) => {
    const id = c.req.param('id')
    const catalog = await service.findCatalogById(id)

    if (!catalog) {
      throw new NotFoundError(`Catalog with id ${id} not found`)
    }

    return c.json(catalog)
  })

  router.get('/', async (c) => {
    const pagination = getPagination(c)
    const { items, totalCount } = await service.listCatalogs(pagination)

    c.header('X-Total-Count', totalCount.toString())
    c.header('X-Result-Count', items.length.toString())

    return c.json(items)
  })

  router.patch('/:id', async (c) => {
    const id = c.req.param('id')
    const body = await c.req.json()
    const catalog = await service.updateCatalog(id, body)

    if (!catalog) {
      throw new NotFoundError(`Catalog with id ${id} not found`)
    }

    return c.json(catalog)
  })

  router.delete('/:id', async (c) => {
    const id = c.req.param('id')
    const deleted = await service.deleteCatalog(id)

    if (!deleted) {
      throw new NotFoundError(`Catalog with id ${id} not found`)
    }

    return c.body(null, 204)
  })

  return router
}
