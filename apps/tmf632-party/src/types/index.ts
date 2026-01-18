import type {
  Characteristic,
  ContactMedium,
  RelatedParty,
  TimePeriod,
  TMForumEntity
} from '@tm-forum/shared'

export interface IndividualDto extends TMForumEntity {
  birthDate?: string
  countryOfBirth?: string
  deathDate?: string
  familyName?: string
  formattedName?: string
  fullName?: string
  gender?: string
  givenName?: string
  location?: string
  maritalStatus?: string
  middleName?: string
  nationality?: string
  placeOfBirth?: string
  status?: string
  title?: string
  validFor?: TimePeriod
  contactMedium?: ContactMedium[]
  partyCharacteristic?: Characteristic[]
  relatedParty?: RelatedParty[]
}

export interface CreateIndividualRequest {
  birthDate?: string
  countryOfBirth?: string
  deathDate?: string
  familyName?: string
  formattedName?: string
  fullName?: string
  gender?: string
  givenName?: string
  location?: string
  maritalStatus?: string
  middleName?: string
  nationality?: string
  placeOfBirth?: string
  status?: string
  title?: string
  validFor?: TimePeriod
  contactMedium?: ContactMedium[]
  partyCharacteristic?: Characteristic[]
  relatedParty?: RelatedParty[]
}

export interface UpdateIndividualRequest {
  birthDate?: string
  countryOfBirth?: string
  deathDate?: string
  familyName?: string
  formattedName?: string
  fullName?: string
  gender?: string
  givenName?: string
  location?: string
  maritalStatus?: string
  middleName?: string
  nationality?: string
  placeOfBirth?: string
  status?: string
  title?: string
  validFor?: TimePeriod
  contactMedium?: ContactMedium[]
  partyCharacteristic?: Characteristic[]
  relatedParty?: RelatedParty[]
}

export interface OrganizationDto extends TMForumEntity {
  isHeadOffice?: boolean
  isLegalEntity?: boolean
  name?: string
  nameType?: string
  organizationType?: string
  status?: string
  tradingName?: string
  validFor?: TimePeriod
  contactMedium?: ContactMedium[]
  partyCharacteristic?: Characteristic[]
  relatedParty?: RelatedParty[]
}

export interface CreateOrganizationRequest {
  isHeadOffice?: boolean
  isLegalEntity?: boolean
  name?: string
  nameType?: string
  organizationType?: string
  status?: string
  tradingName?: string
  validFor?: TimePeriod
  contactMedium?: ContactMedium[]
  partyCharacteristic?: Characteristic[]
  relatedParty?: RelatedParty[]
}

export interface UpdateOrganizationRequest {
  isHeadOffice?: boolean
  isLegalEntity?: boolean
  name?: string
  nameType?: string
  organizationType?: string
  status?: string
  tradingName?: string
  validFor?: TimePeriod
  contactMedium?: ContactMedium[]
  partyCharacteristic?: Characteristic[]
  relatedParty?: RelatedParty[]
}
