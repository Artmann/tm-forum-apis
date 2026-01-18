import { Hono } from 'hono'
import { NotFoundError, getPagination } from '@tm-forum/tmf-common'
import { CategoryService } from '../services/category.service'

export function createCategoryRoutes(database: any, baseUrl: string) {
  const router = new Hono()
  const service = new CategoryService(database, baseUrl)

  router.post('/', async (c) => {
    const body = await c.req.json()
    const category = await service.createCategory(body)
    return c.json(category, 201)
  })

  router.get('/:id', async (c) => {
    const id = c.req.param('id')
    const category = await service.findCategoryById(id)

    if (!category) {
      throw new NotFoundError(`Category with id ${id} not found`)
    }

    return c.json(category)
  })

  router.get('/', async (c) => {
    const pagination = getPagination(c)
    const { items, totalCount } = await service.listCategories(pagination)

    c.header('X-Total-Count', totalCount.toString())
    c.header('X-Result-Count', items.length.toString())

    return c.json(items)
  })

  router.patch('/:id', async (c) => {
    const id = c.req.param('id')
    const body = await c.req.json()
    const category = await service.updateCategory(id, body)

    if (!category) {
      throw new NotFoundError(`Category with id ${id} not found`)
    }

    return c.json(category)
  })

  router.delete('/:id', async (c) => {
    const id = c.req.param('id')
    const deleted = await service.deleteCategory(id)

    if (!deleted) {
      throw new NotFoundError(`Category with id ${id} not found`)
    }

    return c.body(null, 204)
  })

  return router
}
