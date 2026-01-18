import type { Context, ErrorHandler } from 'hono'
import type { TMForumError } from '@tm-forum/shared'

export class TMForumApiError extends Error {
  public readonly code: string
  public readonly httpStatus: number
  public readonly reason: string
  public readonly referenceError?: string

  constructor(options: {
    code: string
    httpStatus: number
    reason: string
    message?: string
    referenceError?: string
  }) {
    super(options.message ?? options.reason)
    this.name = 'TMForumApiError'
    this.code = options.code
    this.httpStatus = options.httpStatus
    this.reason = options.reason
    this.referenceError = options.referenceError
  }
}

export class NotFoundError extends TMForumApiError {
  constructor(resourceType: string, id: string) {
    super({
      code: '60',
      httpStatus: 404,
      reason: 'Not Found',
      message: `${resourceType} with id ${id} not found`
    })
  }
}

export class BadRequestError extends TMForumApiError {
  constructor(message: string) {
    super({
      code: '20',
      httpStatus: 400,
      reason: 'Bad Request',
      message
    })
  }
}

export class ValidationError extends TMForumApiError {
  constructor(message: string) {
    super({
      code: '21',
      httpStatus: 400,
      reason: 'Validation Error',
      message
    })
  }
}

export class ConflictError extends TMForumApiError {
  constructor(message: string) {
    super({
      code: '62',
      httpStatus: 409,
      reason: 'Conflict',
      message
    })
  }
}

export class InternalServerError extends TMForumApiError {
  constructor(message?: string) {
    super({
      code: '1',
      httpStatus: 500,
      reason: 'Internal Server Error',
      message: message ?? 'An unexpected error occurred'
    })
  }
}

function toTMForumError(error: unknown): TMForumError {
  if (error instanceof TMForumApiError) {
    return {
      code: error.code,
      reason: error.reason,
      message: error.message,
      status: String(error.httpStatus),
      referenceError: error.referenceError,
      '@type': 'Error'
    }
  }

  if (error instanceof Error) {
    return {
      code: '1',
      reason: 'Internal Server Error',
      message: error.message,
      status: '500',
      '@type': 'Error'
    }
  }

  return {
    code: '1',
    reason: 'Internal Server Error',
    message: 'An unexpected error occurred',
    status: '500',
    '@type': 'Error'
  }
}

export const errorHandler: ErrorHandler = (error: Error, c: Context) => {
  const tmError = toTMForumError(error)
  const status = error instanceof TMForumApiError ? error.httpStatus : 500

  return c.json(tmError, status as 400 | 404 | 409 | 500)
}
