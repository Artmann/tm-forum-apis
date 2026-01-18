import { eq } from 'drizzle-orm'
import type { PaginationParams } from '@tm-forum/shared'
import { categories } from '../db/schema'
import type { CategoryDto, CreateCategoryRequest, UpdateCategoryRequest } from '../types'

export class CategoryService {
  constructor(
    private db: any,
    private baseUrl: string
  ) {}

  async createCategory(data: CreateCategoryRequest): Promise<CategoryDto> {
    const [category] = await this.db
      .insert(categories)
      .values({
        type: data['@type'] ?? 'Category',
        baseType: data['@baseType'],
        schemaLocation: data['@schemaLocation'],
        description: data.description,
        isRoot: data.isRoot ?? false,
        lastUpdate: new Date(),
        lifecycleStatus: data.lifecycleStatus,
        name: data.name,
        version: data.version,
        parentId: data.parentId,
        validForStart: data.validFor?.startDateTime
          ? new Date(data.validFor.startDateTime)
          : undefined,
        validForEnd: data.validFor?.endDateTime
          ? new Date(data.validFor.endDateTime)
          : undefined
      })
      .returning()

    const href = `${this.baseUrl}/tmf-api/productCatalogManagement/v4/category/${category.id}`
    await this.db.update(categories).set({ href }).where(eq(categories.id, category.id))

    return this.findCategoryById(category.id) as Promise<CategoryDto>
  }

  async findCategoryById(id: string): Promise<CategoryDto | null> {
    const [category] = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, id))

    if (!category) {
      return null
    }

    const subCategories = await this.db
      .select()
      .from(categories)
      .where(eq(categories.parentId, id))

    return this.transformCategory(category, subCategories)
  }

  async listCategories(
    pagination: PaginationParams
  ): Promise<{ items: CategoryDto[]; totalCount: number }> {
    const allCategories = await this.db.select().from(categories)
    const totalCount = allCategories.length

    const paginatedCategories = await this.db
      .select()
      .from(categories)
      .limit(pagination.limit)
      .offset(pagination.offset)

    const items = await Promise.all(
      paginatedCategories.map(async (category: any) => {
        const subCategories = await this.db
          .select()
          .from(categories)
          .where(eq(categories.parentId, category.id))
        return this.transformCategory(category, subCategories)
      })
    )

    return { items, totalCount }
  }

  async updateCategory(
    id: string,
    data: UpdateCategoryRequest
  ): Promise<CategoryDto | null> {
    const existing = await this.findCategoryById(id)
    if (!existing) {
      return null
    }

    const updateData: any = {
      updatedAt: new Date(),
      lastUpdate: new Date()
    }

    if (data.description !== undefined) updateData.description = data.description
    if (data.isRoot !== undefined) updateData.isRoot = data.isRoot
    if (data.lifecycleStatus !== undefined)
      updateData.lifecycleStatus = data.lifecycleStatus
    if (data.name !== undefined) updateData.name = data.name
    if (data.version !== undefined) updateData.version = data.version
    if (data.parentId !== undefined) updateData.parentId = data.parentId

    await this.db.update(categories).set(updateData).where(eq(categories.id, id))

    return this.findCategoryById(id)
  }

  async deleteCategory(id: string): Promise<boolean> {
    const existing = await this.findCategoryById(id)
    if (!existing) {
      return false
    }

    await this.db.delete(categories).where(eq(categories.id, id))
    return true
  }

  private transformCategory(category: any, subCategories: any[]): CategoryDto {
    const result: CategoryDto = {
      id: category.id,
      href: category.href,
      '@type': category.type
    }

    if (category.baseType) result['@baseType'] = category.baseType
    if (category.schemaLocation) result['@schemaLocation'] = category.schemaLocation
    if (category.description) result.description = category.description
    if (category.isRoot !== null) result.isRoot = category.isRoot
    if (category.lastUpdate) result.lastUpdate = category.lastUpdate.toISOString()
    if (category.lifecycleStatus) result.lifecycleStatus = category.lifecycleStatus
    if (category.name) result.name = category.name
    if (category.version) result.version = category.version
    if (category.parentId) result.parentId = category.parentId

    if (category.validForStart || category.validForEnd) {
      result.validFor = {}
      if (category.validForStart) {
        result.validFor.startDateTime = category.validForStart.toISOString()
      }
      if (category.validForEnd) {
        result.validFor.endDateTime = category.validForEnd.toISOString()
      }
    }

    if (subCategories && subCategories.length > 0) {
      result.subCategory = subCategories.map((sub) => ({
        id: sub.id,
        href: sub.href,
        name: sub.name,
        version: sub.version,
        '@referredType': 'Category'
      }))
    }

    return result
  }
}
