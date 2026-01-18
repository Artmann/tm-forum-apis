import type { Context, MiddlewareHandler, Next } from 'hono'
import type { PaginationParams } from '@tm-forum/shared'

export interface PaginationOptions {
  defaultLimit?: number
  maxLimit?: number
  offsetParam?: string
  limitParam?: string
}

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

export function pagination(options: PaginationOptions = {}): MiddlewareHandler {
  const defaultLimit = options.defaultLimit ?? DEFAULT_LIMIT
  const maxLimit = options.maxLimit ?? MAX_LIMIT
  const offsetParam = options.offsetParam ?? 'offset'
  const limitParam = options.limitParam ?? 'limit'

  return async (c: Context, next: Next) => {
    const offsetStr = c.req.query(offsetParam)
    const limitStr = c.req.query(limitParam)

    let offset = 0
    let limit = defaultLimit

    if (offsetStr) {
      const parsed = parseInt(offsetStr, 10)
      if (!isNaN(parsed) && parsed >= 0) {
        offset = parsed
      }
    }

    if (limitStr) {
      const parsed = parseInt(limitStr, 10)
      if (!isNaN(parsed) && parsed > 0) {
        limit = Math.min(parsed, maxLimit)
      }
    }

    const paginationParams: PaginationParams = { offset, limit }
    c.set('pagination', paginationParams)

    await next()
  }
}

export function getPagination(c: Context): PaginationParams {
  return c.get('pagination') ?? { offset: 0, limit: DEFAULT_LIMIT }
}

export function setPaginationHeaders(
  c: Context,
  totalCount: number,
  resultCount: number
): void {
  c.header('X-Total-Count', String(totalCount))
  c.header('X-Result-Count', String(resultCount))
}
