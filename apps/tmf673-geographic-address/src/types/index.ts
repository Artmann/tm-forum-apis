export interface GeographicLocation {
  id?: string
  href?: string
  name?: string
  geometryType?: string
  accuracy?: string
  spatialRef?: string
  geometry?: unknown[]
  '@type'?: string
  '@baseType'?: string
  '@schemaLocation'?: string
}

export interface GeographicSubAddressDto {
  id: string
  href: string
  buildingName?: string
  levelNumber?: string
  levelType?: string
  name?: string
  privateStreetName?: string
  privateStreetNumber?: string
  subAddressType?: string
  subUnitNumber?: string
  subUnitType?: string
  '@type': string
  '@baseType'?: string
  '@schemaLocation'?: string
}

export interface GeographicAddressDto {
  id: string
  href: string
  city?: string
  country?: string
  locality?: string
  name?: string
  postcode?: string
  stateOrProvince?: string
  streetName?: string
  streetNr?: string
  streetNrLast?: string
  streetNrLastSuffix?: string
  streetNrSuffix?: string
  streetSuffix?: string
  streetType?: string
  geographicLocation?: GeographicLocation
  geographicSubAddress?: GeographicSubAddressDto[]
  '@type': string
  '@baseType'?: string
  '@schemaLocation'?: string
}

export interface CreateGeographicAddressRequest {
  city?: string
  country?: string
  locality?: string
  name?: string
  postcode?: string
  stateOrProvince?: string
  streetName?: string
  streetNr?: string
  streetNrLast?: string
  streetNrLastSuffix?: string
  streetNrSuffix?: string
  streetSuffix?: string
  streetType?: string
  geographicLocation?: GeographicLocation
  geographicSubAddress?: CreateGeographicSubAddressRequest[]
  '@type'?: string
  '@baseType'?: string
  '@schemaLocation'?: string
}

export interface UpdateGeographicAddressRequest {
  city?: string
  country?: string
  locality?: string
  name?: string
  postcode?: string
  stateOrProvince?: string
  streetName?: string
  streetNr?: string
  streetNrLast?: string
  streetNrLastSuffix?: string
  streetNrSuffix?: string
  streetSuffix?: string
  streetType?: string
  geographicLocation?: GeographicLocation
  geographicSubAddress?: CreateGeographicSubAddressRequest[]
  '@type'?: string
  '@baseType'?: string
  '@schemaLocation'?: string
}

export interface CreateGeographicSubAddressRequest {
  buildingName?: string
  levelNumber?: string
  levelType?: string
  name?: string
  privateStreetName?: string
  privateStreetNumber?: string
  subAddressType?: string
  subUnitNumber?: string
  subUnitType?: string
  '@type'?: string
  '@baseType'?: string
  '@schemaLocation'?: string
}

export interface UpdateGeographicSubAddressRequest {
  buildingName?: string
  levelNumber?: string
  levelType?: string
  name?: string
  privateStreetName?: string
  privateStreetNumber?: string
  subAddressType?: string
  subUnitNumber?: string
  subUnitType?: string
  '@type'?: string
  '@baseType'?: string
  '@schemaLocation'?: string
}
