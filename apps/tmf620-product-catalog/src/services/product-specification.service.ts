import { eq } from 'drizzle-orm'
import type { PaginationParams } from '@tm-forum/shared'
import { productSpecifications, productSpecCharacteristics } from '../db/schema'
import type {
  CreateProductSpecificationRequest,
  ProductSpecificationDto,
  UpdateProductSpecificationRequest
} from '../types'

export class ProductSpecificationService {
  constructor(
    private db: any,
    private baseUrl: string
  ) {}

  async createProductSpecification(
    data: CreateProductSpecificationRequest
  ): Promise<ProductSpecificationDto> {
    const { productSpecCharacteristic, ...specData } = data

    const [spec] = await this.db
      .insert(productSpecifications)
      .values({
        type: data['@type'] ?? 'ProductSpecification',
        baseType: data['@baseType'],
        schemaLocation: data['@schemaLocation'],
        brand: specData.brand,
        description: specData.description,
        isBundle: specData.isBundle ?? false,
        lastUpdate: new Date(),
        lifecycleStatus: specData.lifecycleStatus,
        name: specData.name,
        productNumber: specData.productNumber,
        version: specData.version,
        validForStart: specData.validFor?.startDateTime
          ? new Date(specData.validFor.startDateTime)
          : undefined,
        validForEnd: specData.validFor?.endDateTime
          ? new Date(specData.validFor.endDateTime)
          : undefined
      })
      .returning()

    const href = `${this.baseUrl}/tmf-api/productCatalogManagement/v4/productSpecification/${spec.id}`
    await this.db
      .update(productSpecifications)
      .set({ href })
      .where(eq(productSpecifications.id, spec.id))

    if (productSpecCharacteristic && productSpecCharacteristic.length > 0) {
      for (const char of productSpecCharacteristic) {
        await this.db.insert(productSpecCharacteristics).values({
          productSpecificationId: spec.id,
          name: char.name,
          description: char.description,
          configurable: char.configurable,
          extensible: char.extensible,
          isUnique: char.isUnique,
          maxCardinality: char.maxCardinality,
          minCardinality: char.minCardinality,
          regex: char.regex,
          valueType: char.valueType,
          validForStart: char.validFor?.startDateTime
            ? new Date(char.validFor.startDateTime)
            : undefined,
          validForEnd: char.validFor?.endDateTime
            ? new Date(char.validFor.endDateTime)
            : undefined,
          values: char.productSpecCharacteristicValue
        })
      }
    }

    return this.findProductSpecificationById(spec.id) as Promise<ProductSpecificationDto>
  }

  async findProductSpecificationById(id: string): Promise<ProductSpecificationDto | null> {
    const [spec] = await this.db
      .select()
      .from(productSpecifications)
      .where(eq(productSpecifications.id, id))

    if (!spec) {
      return null
    }

    const characteristics = await this.db
      .select()
      .from(productSpecCharacteristics)
      .where(eq(productSpecCharacteristics.productSpecificationId, id))

    return this.transformProductSpecification(spec, characteristics)
  }

  async listProductSpecifications(
    pagination: PaginationParams
  ): Promise<{ items: ProductSpecificationDto[]; totalCount: number }> {
    const allSpecs = await this.db.select().from(productSpecifications)
    const totalCount = allSpecs.length

    const paginatedSpecs = await this.db
      .select()
      .from(productSpecifications)
      .limit(pagination.limit)
      .offset(pagination.offset)

    const items = await Promise.all(
      paginatedSpecs.map(async (spec: any) => {
        const characteristics = await this.db
          .select()
          .from(productSpecCharacteristics)
          .where(eq(productSpecCharacteristics.productSpecificationId, spec.id))
        return this.transformProductSpecification(spec, characteristics)
      })
    )

    return { items, totalCount }
  }

  async updateProductSpecification(
    id: string,
    data: UpdateProductSpecificationRequest
  ): Promise<ProductSpecificationDto | null> {
    const existing = await this.findProductSpecificationById(id)
    if (!existing) {
      return null
    }

    const { productSpecCharacteristic, ...specData } = data

    const updateData: any = {
      updatedAt: new Date(),
      lastUpdate: new Date()
    }

    if (specData.brand !== undefined) updateData.brand = specData.brand
    if (specData.description !== undefined) updateData.description = specData.description
    if (specData.isBundle !== undefined) updateData.isBundle = specData.isBundle
    if (specData.lifecycleStatus !== undefined)
      updateData.lifecycleStatus = specData.lifecycleStatus
    if (specData.name !== undefined) updateData.name = specData.name
    if (specData.productNumber !== undefined)
      updateData.productNumber = specData.productNumber
    if (specData.version !== undefined) updateData.version = specData.version

    await this.db
      .update(productSpecifications)
      .set(updateData)
      .where(eq(productSpecifications.id, id))

    if (productSpecCharacteristic) {
      await this.db
        .delete(productSpecCharacteristics)
        .where(eq(productSpecCharacteristics.productSpecificationId, id))

      for (const char of productSpecCharacteristic) {
        await this.db.insert(productSpecCharacteristics).values({
          productSpecificationId: id,
          name: char.name,
          description: char.description,
          configurable: char.configurable,
          extensible: char.extensible,
          isUnique: char.isUnique,
          maxCardinality: char.maxCardinality,
          minCardinality: char.minCardinality,
          regex: char.regex,
          valueType: char.valueType,
          validForStart: char.validFor?.startDateTime
            ? new Date(char.validFor.startDateTime)
            : undefined,
          validForEnd: char.validFor?.endDateTime
            ? new Date(char.validFor.endDateTime)
            : undefined,
          values: char.productSpecCharacteristicValue
        })
      }
    }

    return this.findProductSpecificationById(id)
  }

  async deleteProductSpecification(id: string): Promise<boolean> {
    const existing = await this.findProductSpecificationById(id)
    if (!existing) {
      return false
    }

    await this.db.delete(productSpecifications).where(eq(productSpecifications.id, id))
    return true
  }

  private transformProductSpecification(
    spec: any,
    characteristics: any[]
  ): ProductSpecificationDto {
    const result: ProductSpecificationDto = {
      id: spec.id,
      href: spec.href,
      '@type': spec.type
    }

    if (spec.baseType) result['@baseType'] = spec.baseType
    if (spec.schemaLocation) result['@schemaLocation'] = spec.schemaLocation
    if (spec.brand) result.brand = spec.brand
    if (spec.description) result.description = spec.description
    if (spec.isBundle !== null) result.isBundle = spec.isBundle
    if (spec.lastUpdate) result.lastUpdate = spec.lastUpdate.toISOString()
    if (spec.lifecycleStatus) result.lifecycleStatus = spec.lifecycleStatus
    if (spec.name) result.name = spec.name
    if (spec.productNumber) result.productNumber = spec.productNumber
    if (spec.version) result.version = spec.version

    if (spec.validForStart || spec.validForEnd) {
      result.validFor = {}
      if (spec.validForStart) {
        result.validFor.startDateTime = spec.validForStart.toISOString()
      }
      if (spec.validForEnd) {
        result.validFor.endDateTime = spec.validForEnd.toISOString()
      }
    }

    if (characteristics && characteristics.length > 0) {
      result.productSpecCharacteristic = characteristics.map((char) => {
        const charResult: any = {
          id: char.id,
          name: char.name
        }
        if (char.description) charResult.description = char.description
        if (char.configurable !== null) charResult.configurable = char.configurable
        if (char.extensible !== null) charResult.extensible = char.extensible
        if (char.isUnique !== null) charResult.isUnique = char.isUnique
        if (char.maxCardinality !== null) charResult.maxCardinality = char.maxCardinality
        if (char.minCardinality !== null) charResult.minCardinality = char.minCardinality
        if (char.regex) charResult.regex = char.regex
        if (char.valueType) charResult.valueType = char.valueType
        if (char.values) charResult.productSpecCharacteristicValue = char.values
        if (char.validForStart || char.validForEnd) {
          charResult.validFor = {}
          if (char.validForStart) {
            charResult.validFor.startDateTime = char.validForStart.toISOString()
          }
          if (char.validForEnd) {
            charResult.validFor.endDateTime = char.validForEnd.toISOString()
          }
        }
        return charResult
      })
    }

    return result
  }
}
