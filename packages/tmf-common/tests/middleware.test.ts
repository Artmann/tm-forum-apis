import { describe, expect, it } from 'bun:test'
import { Hono } from 'hono'
import {
  errorHandler,
  fieldsFilter,
  getPagination,
  getRequestId,
  NotFoundError,
  pagination,
  requestId,
  BadRequestError,
  ValidationError
} from '../src'

describe('requestId middleware', () => {
  it('should generate a new request id when none provided', async () => {
    const app = new Hono()
    app.use(requestId())
    app.get('/test', (c) => c.json({ id: getRequestId(c) }))

    const res = await app.request('/test')
    const header = res.headers.get('X-Request-Id')

    expect(header).toBeDefined()
    expect(header).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    )
  })

  it('should use existing request id from header', async () => {
    const app = new Hono()
    app.use(requestId())
    app.get('/test', (c) => c.json({ id: getRequestId(c) }))

    const existingId = 'test-request-id-123'
    const res = await app.request('/test', {
      headers: { 'X-Request-Id': existingId }
    })

    expect(res.headers.get('X-Request-Id')).toEqual(existingId)
    const body = await res.json()
    expect(body.id).toEqual(existingId)
  })
})

describe('pagination middleware', () => {
  it('should use default values when no params provided', async () => {
    const app = new Hono()
    app.use(pagination())
    app.get('/test', (c) => c.json(getPagination(c)))

    const res = await app.request('/test')
    const body = await res.json()

    expect(body.offset).toEqual(0)
    expect(body.limit).toEqual(20)
  })

  it('should parse offset and limit from query params', async () => {
    const app = new Hono()
    app.use(pagination())
    app.get('/test', (c) => c.json(getPagination(c)))

    const res = await app.request('/test?offset=10&limit=50')
    const body = await res.json()

    expect(body.offset).toEqual(10)
    expect(body.limit).toEqual(50)
  })

  it('should cap limit at max value', async () => {
    const app = new Hono()
    app.use(pagination({ maxLimit: 100 }))
    app.get('/test', (c) => c.json(getPagination(c)))

    const res = await app.request('/test?limit=500')
    const body = await res.json()

    expect(body.limit).toEqual(100)
  })

  it('should ignore negative offset', async () => {
    const app = new Hono()
    app.use(pagination())
    app.get('/test', (c) => c.json(getPagination(c)))

    const res = await app.request('/test?offset=-5')
    const body = await res.json()

    expect(body.offset).toEqual(0)
  })
})

describe('fieldsFilter middleware', () => {
  it('should return full response when no fields param', async () => {
    const app = new Hono()
    app.use(fieldsFilter())
    app.get('/test', (c) =>
      c.json({ id: '1', name: 'Test', status: 'active' })
    )

    const res = await app.request('/test')
    const body = await res.json()

    expect(body).toEqual({ id: '1', name: 'Test', status: 'active' })
  })

  it('should filter response to requested fields', async () => {
    const app = new Hono()
    app.use(fieldsFilter())
    app.get('/test', (c) =>
      c.json({ id: '1', name: 'Test', status: 'active' })
    )

    const res = await app.request('/test?fields=id,name')
    const body = await res.json()

    expect(body).toEqual({ id: '1', name: 'Test' })
  })

  it('should filter array responses', async () => {
    const app = new Hono()
    app.use(fieldsFilter())
    app.get('/test', (c) =>
      c.json([
        { id: '1', name: 'Test1', status: 'active' },
        { id: '2', name: 'Test2', status: 'inactive' }
      ])
    )

    const res = await app.request('/test?fields=id,status')
    const body = await res.json()

    expect(body).toEqual([
      { id: '1', status: 'active' },
      { id: '2', status: 'inactive' }
    ])
  })
})

describe('errorHandler', () => {
  it('should convert NotFoundError to TM Forum format', async () => {
    const app = new Hono()
    app.onError(errorHandler)
    app.get('/test', () => {
      throw new NotFoundError('Individual', '123')
    })

    const res = await app.request('/test')
    const body = await res.json()

    expect(res.status).toEqual(404)
    expect(body.code).toEqual('60')
    expect(body.reason).toEqual('Not Found')
    expect(body.message).toEqual('Individual with id 123 not found')
    expect(body['@type']).toEqual('Error')
  })

  it('should convert BadRequestError to TM Forum format', async () => {
    const app = new Hono()
    app.onError(errorHandler)
    app.get('/test', () => {
      throw new BadRequestError('Invalid input')
    })

    const res = await app.request('/test')
    const body = await res.json()

    expect(res.status).toEqual(400)
    expect(body.code).toEqual('20')
    expect(body.reason).toEqual('Bad Request')
  })

  it('should convert ValidationError to TM Forum format', async () => {
    const app = new Hono()
    app.onError(errorHandler)
    app.get('/test', () => {
      throw new ValidationError('Name is required')
    })

    const res = await app.request('/test')
    const body = await res.json()

    expect(res.status).toEqual(400)
    expect(body.code).toEqual('21')
    expect(body.reason).toEqual('Validation Error')
  })

  it('should convert unknown errors to 500', async () => {
    const app = new Hono()
    app.onError(errorHandler)
    app.get('/test', () => {
      throw new Error('Something went wrong')
    })

    const res = await app.request('/test')
    const body = await res.json()

    expect(res.status).toEqual(500)
    expect(body.code).toEqual('1')
    expect(body.reason).toEqual('Internal Server Error')
  })
})
