import { eq } from 'drizzle-orm'
import type { PaginationParams } from '@tm-forum/shared'
import { productOfferings, productOfferingCategories } from '../db/schema'
import type {
  CreateProductOfferingRequest,
  ProductOfferingDto,
  UpdateProductOfferingRequest
} from '../types'

export class ProductOfferingService {
  constructor(
    private db: any,
    private baseUrl: string
  ) {}

  async createProductOffering(
    data: CreateProductOfferingRequest
  ): Promise<ProductOfferingDto> {
    const { category, productSpecification, ...offeringData } = data

    const [offering] = await this.db
      .insert(productOfferings)
      .values({
        type: data['@type'] ?? 'ProductOffering',
        baseType: data['@baseType'],
        schemaLocation: data['@schemaLocation'],
        description: offeringData.description,
        isBundle: offeringData.isBundle ?? false,
        isSellable: offeringData.isSellable ?? true,
        lastUpdate: new Date(),
        lifecycleStatus: offeringData.lifecycleStatus,
        name: offeringData.name,
        statusReason: offeringData.statusReason,
        version: offeringData.version,
        validForStart: offeringData.validFor?.startDateTime
          ? new Date(offeringData.validFor.startDateTime)
          : undefined,
        validForEnd: offeringData.validFor?.endDateTime
          ? new Date(offeringData.validFor.endDateTime)
          : undefined,
        productSpecificationId: productSpecification?.id
      })
      .returning()

    const href = `${this.baseUrl}/tmf-api/productCatalogManagement/v4/productOffering/${offering.id}`
    await this.db
      .update(productOfferings)
      .set({ href })
      .where(eq(productOfferings.id, offering.id))

    if (category && category.length > 0) {
      for (const cat of category) {
        await this.db.insert(productOfferingCategories).values({
          productOfferingId: offering.id,
          categoryId: cat.id
        })
      }
    }

    return this.findProductOfferingById(offering.id) as Promise<ProductOfferingDto>
  }

  async findProductOfferingById(id: string): Promise<ProductOfferingDto | null> {
    const [offering] = await this.db
      .select()
      .from(productOfferings)
      .where(eq(productOfferings.id, id))

    if (!offering) {
      return null
    }

    const categories = await this.db
      .select()
      .from(productOfferingCategories)
      .where(eq(productOfferingCategories.productOfferingId, id))

    return this.transformProductOffering(offering, categories)
  }

  async listProductOfferings(
    pagination: PaginationParams
  ): Promise<{ items: ProductOfferingDto[]; totalCount: number }> {
    const allOfferings = await this.db.select().from(productOfferings)
    const totalCount = allOfferings.length

    const paginatedOfferings = await this.db
      .select()
      .from(productOfferings)
      .limit(pagination.limit)
      .offset(pagination.offset)

    const items = await Promise.all(
      paginatedOfferings.map(async (offering: any) => {
        const categories = await this.db
          .select()
          .from(productOfferingCategories)
          .where(eq(productOfferingCategories.productOfferingId, offering.id))
        return this.transformProductOffering(offering, categories)
      })
    )

    return { items, totalCount }
  }

  async updateProductOffering(
    id: string,
    data: UpdateProductOfferingRequest
  ): Promise<ProductOfferingDto | null> {
    const existing = await this.findProductOfferingById(id)
    if (!existing) {
      return null
    }

    const { category, productSpecification, ...offeringData } = data

    const updateData: any = {
      updatedAt: new Date(),
      lastUpdate: new Date()
    }

    if (offeringData.description !== undefined)
      updateData.description = offeringData.description
    if (offeringData.isBundle !== undefined) updateData.isBundle = offeringData.isBundle
    if (offeringData.isSellable !== undefined)
      updateData.isSellable = offeringData.isSellable
    if (offeringData.lifecycleStatus !== undefined)
      updateData.lifecycleStatus = offeringData.lifecycleStatus
    if (offeringData.name !== undefined) updateData.name = offeringData.name
    if (offeringData.statusReason !== undefined)
      updateData.statusReason = offeringData.statusReason
    if (offeringData.version !== undefined) updateData.version = offeringData.version
    if (productSpecification !== undefined)
      updateData.productSpecificationId = productSpecification?.id

    await this.db
      .update(productOfferings)
      .set(updateData)
      .where(eq(productOfferings.id, id))

    if (category) {
      await this.db
        .delete(productOfferingCategories)
        .where(eq(productOfferingCategories.productOfferingId, id))

      for (const cat of category) {
        await this.db.insert(productOfferingCategories).values({
          productOfferingId: id,
          categoryId: cat.id
        })
      }
    }

    return this.findProductOfferingById(id)
  }

  async deleteProductOffering(id: string): Promise<boolean> {
    const existing = await this.findProductOfferingById(id)
    if (!existing) {
      return false
    }

    await this.db.delete(productOfferings).where(eq(productOfferings.id, id))
    return true
  }

  private transformProductOffering(
    offering: any,
    categories: any[]
  ): ProductOfferingDto {
    const result: ProductOfferingDto = {
      id: offering.id,
      href: offering.href,
      '@type': offering.type
    }

    if (offering.baseType) result['@baseType'] = offering.baseType
    if (offering.schemaLocation) result['@schemaLocation'] = offering.schemaLocation
    if (offering.description) result.description = offering.description
    if (offering.isBundle !== null) result.isBundle = offering.isBundle
    if (offering.isSellable !== null) result.isSellable = offering.isSellable
    if (offering.lastUpdate) result.lastUpdate = offering.lastUpdate.toISOString()
    if (offering.lifecycleStatus) result.lifecycleStatus = offering.lifecycleStatus
    if (offering.name) result.name = offering.name
    if (offering.statusReason) result.statusReason = offering.statusReason
    if (offering.version) result.version = offering.version

    if (offering.validForStart || offering.validForEnd) {
      result.validFor = {}
      if (offering.validForStart) {
        result.validFor.startDateTime = offering.validForStart.toISOString()
      }
      if (offering.validForEnd) {
        result.validFor.endDateTime = offering.validForEnd.toISOString()
      }
    }

    if (offering.productSpecificationId) {
      result.productSpecification = {
        id: offering.productSpecificationId,
        '@referredType': 'ProductSpecification'
      }
    }

    if (categories && categories.length > 0) {
      result.category = categories.map((cat) => ({
        id: cat.categoryId,
        '@referredType': 'Category'
      }))
    }

    return result
  }
}
