export interface PaginatedResponse<T> {
  items: T[]
  totalCount: number
  offset: number
  limit: number
}

export interface PaginationParams {
  offset: number
  limit: number
}
