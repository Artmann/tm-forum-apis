import { Hono } from 'hono'
import { NotFoundError, getPagination } from '@tm-forum/tmf-common'
import { CustomerService } from '../services/customer.service'

export function createCustomerRoutes(database: any, baseUrl: string) {
  const router = new Hono()
  const service = new CustomerService(database, baseUrl)

  router.post('/', async (c) => {
    const body = await c.req.json()
    const customer = await service.createCustomer(body)
    return c.json(customer, 201)
  })

  router.get('/:id', async (c) => {
    const id = c.req.param('id')
    const customer = await service.findCustomerById(id)

    if (!customer) {
      throw new NotFoundError(`Customer with id ${id} not found`)
    }

    return c.json(customer)
  })

  router.get('/', async (c) => {
    const pagination = getPagination(c)
    const { items, totalCount } = await service.listCustomers(pagination)

    c.header('X-Total-Count', totalCount.toString())
    c.header('X-Result-Count', items.length.toString())

    return c.json(items)
  })

  router.patch('/:id', async (c) => {
    const id = c.req.param('id')
    const body = await c.req.json()
    const customer = await service.updateCustomer(id, body)

    if (!customer) {
      throw new NotFoundError(`Customer with id ${id} not found`)
    }

    return c.json(customer)
  })

  router.delete('/:id', async (c) => {
    const id = c.req.param('id')
    const deleted = await service.deleteCustomer(id)

    if (!deleted) {
      throw new NotFoundError(`Customer with id ${id} not found`)
    }

    return c.body(null, 204)
  })

  return router
}
