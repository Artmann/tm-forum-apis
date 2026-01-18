import type { Context } from 'hono'
import { setPaginationHeaders } from '../middleware/pagination'

export interface ListResponse<T> {
  items: T[]
  totalCount: number
}

export function sendList<T>(
  c: Context,
  response: ListResponse<T>
): Response {
  setPaginationHeaders(c, response.totalCount, response.items.length)
  return c.json(response.items)
}

export function sendCreated<T>(c: Context, entity: T): Response {
  return c.json(entity, 201)
}

export function sendNoContent(c: Context): Response {
  return c.body(null, 204)
}

export function sendOk<T>(c: Context, entity: T): Response {
  return c.json(entity)
}
