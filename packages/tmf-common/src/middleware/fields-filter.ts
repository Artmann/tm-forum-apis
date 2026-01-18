import type { Context, MiddlewareHandler, Next } from 'hono'

export interface FieldsFilterOptions {
  queryParam?: string
}

function filterFields(obj: unknown, fields: string[]): unknown {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => filterFields(item, fields))
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const field of fields) {
      if (field in (obj as Record<string, unknown>)) {
        result[field] = (obj as Record<string, unknown>)[field]
      }
    }
    return result
  }

  return obj
}

export function fieldsFilter(options: FieldsFilterOptions = {}): MiddlewareHandler {
  const queryParam = options.queryParam ?? 'fields'

  return async (c: Context, next: Next) => {
    await next()

    const fieldsParam = c.req.query(queryParam)
    if (!fieldsParam) {
      return
    }

    const fields = fieldsParam.split(',').map((f) => f.trim()).filter(Boolean)
    if (fields.length === 0) {
      return
    }

    const response = c.res
    const contentType = response.headers.get('content-type')

    if (!contentType?.includes('application/json')) {
      return
    }

    try {
      const body = await response.json()
      const filtered = filterFields(body, fields)

      c.res = new Response(JSON.stringify(filtered), {
        status: response.status,
        headers: response.headers
      })
    } catch {
      return
    }
  }
}
