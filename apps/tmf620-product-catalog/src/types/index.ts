import type { TimePeriod, RelatedParty } from '@tm-forum/shared'

export interface CategoryRef {
  id: string
  href?: string
  name?: string
  version?: string
  '@type'?: string
  '@referredType'?: string
}

export interface ProductSpecificationRef {
  id: string
  href?: string
  name?: string
  version?: string
  '@type'?: string
  '@referredType'?: string
}

export interface ProductSpecCharacteristic {
  id?: string
  name?: string
  description?: string
  configurable?: boolean
  extensible?: boolean
  isUnique?: boolean
  maxCardinality?: number
  minCardinality?: number
  regex?: string
  valueType?: string
  validFor?: TimePeriod
  productSpecCharacteristicValue?: any[]
  '@type'?: string
}

export interface CatalogDto {
  id: string
  href: string
  catalogType?: string
  description?: string
  lastUpdate?: string
  lifecycleStatus?: string
  name?: string
  version?: string
  validFor?: TimePeriod
  category?: CategoryRef[]
  relatedParty?: RelatedParty[]
  '@type': string
  '@baseType'?: string
  '@schemaLocation'?: string
}

export interface CreateCatalogRequest {
  catalogType?: string
  description?: string
  lifecycleStatus?: string
  name?: string
  version?: string
  validFor?: TimePeriod
  category?: CategoryRef[]
  relatedParty?: RelatedParty[]
  '@type'?: string
  '@baseType'?: string
  '@schemaLocation'?: string
}

export interface UpdateCatalogRequest extends Partial<CreateCatalogRequest> {}

export interface CategoryDto {
  id: string
  href: string
  description?: string
  isRoot?: boolean
  lastUpdate?: string
  lifecycleStatus?: string
  name?: string
  version?: string
  parentId?: string
  validFor?: TimePeriod
  subCategory?: CategoryRef[]
  productOffering?: { id: string; href?: string; name?: string }[]
  '@type': string
  '@baseType'?: string
  '@schemaLocation'?: string
}

export interface CreateCategoryRequest {
  description?: string
  isRoot?: boolean
  lifecycleStatus?: string
  name?: string
  version?: string
  parentId?: string
  validFor?: TimePeriod
  '@type'?: string
  '@baseType'?: string
  '@schemaLocation'?: string
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {}

export interface ProductOfferingDto {
  id: string
  href: string
  description?: string
  isBundle?: boolean
  isSellable?: boolean
  lastUpdate?: string
  lifecycleStatus?: string
  name?: string
  statusReason?: string
  version?: string
  validFor?: TimePeriod
  category?: CategoryRef[]
  productSpecification?: ProductSpecificationRef
  '@type': string
  '@baseType'?: string
  '@schemaLocation'?: string
}

export interface CreateProductOfferingRequest {
  description?: string
  isBundle?: boolean
  isSellable?: boolean
  lifecycleStatus?: string
  name?: string
  statusReason?: string
  version?: string
  validFor?: TimePeriod
  category?: CategoryRef[]
  productSpecification?: ProductSpecificationRef
  '@type'?: string
  '@baseType'?: string
  '@schemaLocation'?: string
}

export interface UpdateProductOfferingRequest
  extends Partial<CreateProductOfferingRequest> {}

export interface ProductSpecificationDto {
  id: string
  href: string
  brand?: string
  description?: string
  isBundle?: boolean
  lastUpdate?: string
  lifecycleStatus?: string
  name?: string
  productNumber?: string
  version?: string
  validFor?: TimePeriod
  productSpecCharacteristic?: ProductSpecCharacteristic[]
  '@type': string
  '@baseType'?: string
  '@schemaLocation'?: string
}

export interface CreateProductSpecificationRequest {
  brand?: string
  description?: string
  isBundle?: boolean
  lifecycleStatus?: string
  name?: string
  productNumber?: string
  version?: string
  validFor?: TimePeriod
  productSpecCharacteristic?: ProductSpecCharacteristic[]
  '@type'?: string
  '@baseType'?: string
  '@schemaLocation'?: string
}

export interface UpdateProductSpecificationRequest
  extends Partial<CreateProductSpecificationRequest> {}
