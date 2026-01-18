import { eq } from 'drizzle-orm'
import type { PaginationParams } from '@tm-forum/shared'
import { catalogs, catalogCategories, catalogRelatedParties } from '../db/schema'
import type { CatalogDto, CreateCatalogRequest, UpdateCatalogRequest } from '../types'

export class CatalogService {
  constructor(
    private db: any,
    private baseUrl: string
  ) {}

  async createCatalog(data: CreateCatalogRequest): Promise<CatalogDto> {
    const { category, relatedParty, ...catalogData } = data

    const [catalog] = await this.db
      .insert(catalogs)
      .values({
        type: data['@type'] ?? 'Catalog',
        baseType: data['@baseType'],
        schemaLocation: data['@schemaLocation'],
        catalogType: catalogData.catalogType,
        description: catalogData.description,
        lastUpdate: new Date(),
        lifecycleStatus: catalogData.lifecycleStatus,
        name: catalogData.name,
        version: catalogData.version,
        validForStart: catalogData.validFor?.startDateTime
          ? new Date(catalogData.validFor.startDateTime)
          : undefined,
        validForEnd: catalogData.validFor?.endDateTime
          ? new Date(catalogData.validFor.endDateTime)
          : undefined
      })
      .returning()

    const href = `${this.baseUrl}/tmf-api/productCatalogManagement/v4/catalog/${catalog.id}`
    await this.db.update(catalogs).set({ href }).where(eq(catalogs.id, catalog.id))

    if (category && category.length > 0) {
      for (const cat of category) {
        await this.db.insert(catalogCategories).values({
          catalogId: catalog.id,
          categoryId: cat.id
        })
      }
    }

    if (relatedParty && relatedParty.length > 0) {
      for (const party of relatedParty) {
        await this.db.insert(catalogRelatedParties).values({
          catalogId: catalog.id,
          referencedPartyId: party.id,
          referencedPartyHref: party.href,
          name: party.name,
          role: party.role,
          referredType: party['@referredType']
        })
      }
    }

    return this.findCatalogById(catalog.id) as Promise<CatalogDto>
  }

  async findCatalogById(id: string): Promise<CatalogDto | null> {
    const [catalog] = await this.db
      .select()
      .from(catalogs)
      .where(eq(catalogs.id, id))

    if (!catalog) {
      return null
    }

    const categories = await this.db
      .select()
      .from(catalogCategories)
      .where(eq(catalogCategories.catalogId, id))

    const relatedParties = await this.db
      .select()
      .from(catalogRelatedParties)
      .where(eq(catalogRelatedParties.catalogId, id))

    return this.transformCatalog(catalog, categories, relatedParties)
  }

  async listCatalogs(
    pagination: PaginationParams
  ): Promise<{ items: CatalogDto[]; totalCount: number }> {
    const allCatalogs = await this.db.select().from(catalogs)
    const totalCount = allCatalogs.length

    const paginatedCatalogs = await this.db
      .select()
      .from(catalogs)
      .limit(pagination.limit)
      .offset(pagination.offset)

    const items = await Promise.all(
      paginatedCatalogs.map(async (catalog: any) => {
        const categories = await this.db
          .select()
          .from(catalogCategories)
          .where(eq(catalogCategories.catalogId, catalog.id))

        const relatedParties = await this.db
          .select()
          .from(catalogRelatedParties)
          .where(eq(catalogRelatedParties.catalogId, catalog.id))

        return this.transformCatalog(catalog, categories, relatedParties)
      })
    )

    return { items, totalCount }
  }

  async updateCatalog(
    id: string,
    data: UpdateCatalogRequest
  ): Promise<CatalogDto | null> {
    const existing = await this.findCatalogById(id)
    if (!existing) {
      return null
    }

    const { category, relatedParty, ...catalogData } = data

    const updateData: any = {
      updatedAt: new Date(),
      lastUpdate: new Date()
    }

    if (catalogData.catalogType !== undefined)
      updateData.catalogType = catalogData.catalogType
    if (catalogData.description !== undefined)
      updateData.description = catalogData.description
    if (catalogData.lifecycleStatus !== undefined)
      updateData.lifecycleStatus = catalogData.lifecycleStatus
    if (catalogData.name !== undefined) updateData.name = catalogData.name
    if (catalogData.version !== undefined) updateData.version = catalogData.version

    await this.db.update(catalogs).set(updateData).where(eq(catalogs.id, id))

    return this.findCatalogById(id)
  }

  async deleteCatalog(id: string): Promise<boolean> {
    const existing = await this.findCatalogById(id)
    if (!existing) {
      return false
    }

    await this.db.delete(catalogs).where(eq(catalogs.id, id))
    return true
  }

  private transformCatalog(
    catalog: any,
    categories: any[],
    relatedParties: any[]
  ): CatalogDto {
    const result: CatalogDto = {
      id: catalog.id,
      href: catalog.href,
      '@type': catalog.type
    }

    if (catalog.baseType) result['@baseType'] = catalog.baseType
    if (catalog.schemaLocation) result['@schemaLocation'] = catalog.schemaLocation
    if (catalog.catalogType) result.catalogType = catalog.catalogType
    if (catalog.description) result.description = catalog.description
    if (catalog.lastUpdate) result.lastUpdate = catalog.lastUpdate.toISOString()
    if (catalog.lifecycleStatus) result.lifecycleStatus = catalog.lifecycleStatus
    if (catalog.name) result.name = catalog.name
    if (catalog.version) result.version = catalog.version

    if (catalog.validForStart || catalog.validForEnd) {
      result.validFor = {}
      if (catalog.validForStart) {
        result.validFor.startDateTime = catalog.validForStart.toISOString()
      }
      if (catalog.validForEnd) {
        result.validFor.endDateTime = catalog.validForEnd.toISOString()
      }
    }

    if (categories && categories.length > 0) {
      result.category = categories.map((cat) => ({
        id: cat.categoryId,
        '@referredType': 'Category'
      }))
    }

    if (relatedParties && relatedParties.length > 0) {
      result.relatedParty = relatedParties.map((party) => ({
        id: party.referencedPartyId,
        href: party.referencedPartyHref,
        name: party.name,
        role: party.role,
        '@referredType': party.referredType
      }))
    }

    return result
  }
}
