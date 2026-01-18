import type { TimePeriod, Characteristic, ContactMedium, RelatedParty } from '@tm-forum/shared'

export interface EngagedParty {
  id: string
  href?: string
  name?: string
  role?: string
  '@type'?: string
  '@referredType': string
}

export interface CustomerDto {
  id: string
  href: string
  name?: string
  status?: string
  statusReason?: string
  validFor?: TimePeriod
  engagedParty: EngagedParty
  characteristic?: Characteristic[]
  contactMedium?: ContactMedium[]
  relatedParty?: RelatedParty[]
  '@type': string
  '@baseType'?: string
  '@schemaLocation'?: string
}

export interface CreateCustomerRequest {
  name?: string
  status?: string
  statusReason?: string
  validFor?: TimePeriod
  engagedParty: EngagedParty
  characteristic?: Characteristic[]
  contactMedium?: ContactMedium[]
  relatedParty?: RelatedParty[]
  '@type'?: string
  '@baseType'?: string
  '@schemaLocation'?: string
}

export interface UpdateCustomerRequest {
  name?: string
  status?: string
  statusReason?: string
  validFor?: TimePeriod
  engagedParty?: EngagedParty
  characteristic?: Characteristic[]
  contactMedium?: ContactMedium[]
  relatedParty?: RelatedParty[]
  '@type'?: string
  '@baseType'?: string
  '@schemaLocation'?: string
}
