import type { Context, MiddlewareHandler, Next } from 'hono'

export interface RequestIdOptions {
  headerName?: string
  generator?: () => string
}

function defaultGenerator(): string {
  return crypto.randomUUID()
}

export function requestId(options: RequestIdOptions = {}): MiddlewareHandler {
  const headerName = options.headerName ?? 'X-Request-Id'
  const generator = options.generator ?? defaultGenerator

  return async (c: Context, next: Next) => {
    const existingId = c.req.header(headerName)
    const id = existingId ?? generator()

    c.set('requestId', id)
    c.header(headerName, id)

    await next()
  }
}

export function getRequestId(c: Context): string | undefined {
  return c.get('requestId')
}
