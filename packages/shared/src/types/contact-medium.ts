import type { TimePeriod } from './time-period'

export interface MediumCharacteristic {
  city?: string
  contactType?: string
  country?: string
  emailAddress?: string
  faxNumber?: string
  phoneNumber?: string
  postCode?: string
  socialNetworkId?: string
  stateOrProvince?: string
  street1?: string
  street2?: string
  '@type'?: string
}

export interface ContactMedium {
  id?: string
  mediumType: string
  preferred?: boolean
  characteristic: MediumCharacteristic
  validFor?: TimePeriod
  '@type'?: string
}
