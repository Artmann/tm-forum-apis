import { eq } from 'drizzle-orm'
import type { PaginationParams } from '@tm-forum/shared'
import { geographicAddresses, geographicSubAddresses } from '../db/schema'
import type {
  CreateGeographicAddressRequest,
  GeographicAddressDto,
  GeographicSubAddressDto,
  UpdateGeographicAddressRequest
} from '../types'

export class GeographicAddressService {
  constructor(
    private db: any,
    private baseUrl: string
  ) {}

  async createGeographicAddress(
    data: CreateGeographicAddressRequest
  ): Promise<GeographicAddressDto> {
    const { geographicSubAddress, ...addressData } = data

    const [address] = await this.db
      .insert(geographicAddresses)
      .values({
        type: data['@type'] ?? 'GeographicAddress',
        baseType: data['@baseType'],
        schemaLocation: data['@schemaLocation'],
        city: addressData.city,
        country: addressData.country,
        locality: addressData.locality,
        name: addressData.name,
        postcode: addressData.postcode,
        stateOrProvince: addressData.stateOrProvince,
        streetName: addressData.streetName,
        streetNr: addressData.streetNr,
        streetNrLast: addressData.streetNrLast,
        streetNrLastSuffix: addressData.streetNrLastSuffix,
        streetNrSuffix: addressData.streetNrSuffix,
        streetSuffix: addressData.streetSuffix,
        streetType: addressData.streetType,
        geographicLocation: addressData.geographicLocation
      })
      .returning()

    const href = `${this.baseUrl}/tmf-api/geographicAddressManagement/v4/geographicAddress/${address.id}`
    await this.db
      .update(geographicAddresses)
      .set({ href })
      .where(eq(geographicAddresses.id, address.id))

    let subAddresses: any[] = []
    if (geographicSubAddress && geographicSubAddress.length > 0) {
      for (const subAddr of geographicSubAddress) {
        const [inserted] = await this.db
          .insert(geographicSubAddresses)
          .values({
            geographicAddressId: address.id,
            type: subAddr['@type'] ?? 'GeographicSubAddress',
            baseType: subAddr['@baseType'],
            schemaLocation: subAddr['@schemaLocation'],
            buildingName: subAddr.buildingName,
            levelNumber: subAddr.levelNumber,
            levelType: subAddr.levelType,
            name: subAddr.name,
            privateStreetName: subAddr.privateStreetName,
            privateStreetNumber: subAddr.privateStreetNumber,
            subAddressType: subAddr.subAddressType,
            subUnitNumber: subAddr.subUnitNumber,
            subUnitType: subAddr.subUnitType
          })
          .returning()

        const subHref = `${this.baseUrl}/tmf-api/geographicAddressManagement/v4/geographicSubAddress/${inserted.id}`
        await this.db
          .update(geographicSubAddresses)
          .set({ href: subHref })
          .where(eq(geographicSubAddresses.id, inserted.id))

        subAddresses.push({ ...inserted, href: subHref })
      }
    }

    return this.transformAddress({ ...address, href }, subAddresses)
  }

  async findGeographicAddressById(id: string): Promise<GeographicAddressDto | null> {
    const [address] = await this.db
      .select()
      .from(geographicAddresses)
      .where(eq(geographicAddresses.id, id))

    if (!address) {
      return null
    }

    const subAddresses = await this.db
      .select()
      .from(geographicSubAddresses)
      .where(eq(geographicSubAddresses.geographicAddressId, id))

    return this.transformAddress(address, subAddresses)
  }

  async listGeographicAddresses(
    pagination: PaginationParams
  ): Promise<{ items: GeographicAddressDto[]; totalCount: number }> {
    const allAddresses = await this.db.select().from(geographicAddresses)
    const totalCount = allAddresses.length

    const paginatedAddresses = await this.db
      .select()
      .from(geographicAddresses)
      .limit(pagination.limit)
      .offset(pagination.offset)

    const items = await Promise.all(
      paginatedAddresses.map(async (address: any) => {
        const subAddresses = await this.db
          .select()
          .from(geographicSubAddresses)
          .where(eq(geographicSubAddresses.geographicAddressId, address.id))
        return this.transformAddress(address, subAddresses)
      })
    )

    return { items, totalCount }
  }

  async updateGeographicAddress(
    id: string,
    data: UpdateGeographicAddressRequest
  ): Promise<GeographicAddressDto | null> {
    const existing = await this.findGeographicAddressById(id)
    if (!existing) {
      return null
    }

    const { geographicSubAddress, ...addressData } = data

    const updateData: any = {
      updatedAt: new Date()
    }

    if (addressData.city !== undefined) updateData.city = addressData.city
    if (addressData.country !== undefined) updateData.country = addressData.country
    if (addressData.locality !== undefined) updateData.locality = addressData.locality
    if (addressData.name !== undefined) updateData.name = addressData.name
    if (addressData.postcode !== undefined) updateData.postcode = addressData.postcode
    if (addressData.stateOrProvince !== undefined)
      updateData.stateOrProvince = addressData.stateOrProvince
    if (addressData.streetName !== undefined)
      updateData.streetName = addressData.streetName
    if (addressData.streetNr !== undefined) updateData.streetNr = addressData.streetNr
    if (addressData.streetNrLast !== undefined)
      updateData.streetNrLast = addressData.streetNrLast
    if (addressData.streetNrLastSuffix !== undefined)
      updateData.streetNrLastSuffix = addressData.streetNrLastSuffix
    if (addressData.streetNrSuffix !== undefined)
      updateData.streetNrSuffix = addressData.streetNrSuffix
    if (addressData.streetSuffix !== undefined)
      updateData.streetSuffix = addressData.streetSuffix
    if (addressData.streetType !== undefined)
      updateData.streetType = addressData.streetType
    if (addressData.geographicLocation !== undefined)
      updateData.geographicLocation = addressData.geographicLocation

    await this.db
      .update(geographicAddresses)
      .set(updateData)
      .where(eq(geographicAddresses.id, id))

    if (geographicSubAddress) {
      await this.db
        .delete(geographicSubAddresses)
        .where(eq(geographicSubAddresses.geographicAddressId, id))

      for (const subAddr of geographicSubAddress) {
        const [inserted] = await this.db
          .insert(geographicSubAddresses)
          .values({
            geographicAddressId: id,
            type: subAddr['@type'] ?? 'GeographicSubAddress',
            baseType: subAddr['@baseType'],
            schemaLocation: subAddr['@schemaLocation'],
            buildingName: subAddr.buildingName,
            levelNumber: subAddr.levelNumber,
            levelType: subAddr.levelType,
            name: subAddr.name,
            privateStreetName: subAddr.privateStreetName,
            privateStreetNumber: subAddr.privateStreetNumber,
            subAddressType: subAddr.subAddressType,
            subUnitNumber: subAddr.subUnitNumber,
            subUnitType: subAddr.subUnitType
          })
          .returning()

        const subHref = `${this.baseUrl}/tmf-api/geographicAddressManagement/v4/geographicSubAddress/${inserted.id}`
        await this.db
          .update(geographicSubAddresses)
          .set({ href: subHref })
          .where(eq(geographicSubAddresses.id, inserted.id))
      }
    }

    return this.findGeographicAddressById(id)
  }

  async deleteGeographicAddress(id: string): Promise<boolean> {
    const existing = await this.findGeographicAddressById(id)
    if (!existing) {
      return false
    }

    await this.db
      .delete(geographicAddresses)
      .where(eq(geographicAddresses.id, id))

    return true
  }

  private transformAddress(
    address: any,
    subAddresses: any[]
  ): GeographicAddressDto {
    const result: GeographicAddressDto = {
      id: address.id,
      href: address.href,
      '@type': address.type
    }

    if (address.baseType) result['@baseType'] = address.baseType
    if (address.schemaLocation) result['@schemaLocation'] = address.schemaLocation
    if (address.city) result.city = address.city
    if (address.country) result.country = address.country
    if (address.locality) result.locality = address.locality
    if (address.name) result.name = address.name
    if (address.postcode) result.postcode = address.postcode
    if (address.stateOrProvince) result.stateOrProvince = address.stateOrProvince
    if (address.streetName) result.streetName = address.streetName
    if (address.streetNr) result.streetNr = address.streetNr
    if (address.streetNrLast) result.streetNrLast = address.streetNrLast
    if (address.streetNrLastSuffix)
      result.streetNrLastSuffix = address.streetNrLastSuffix
    if (address.streetNrSuffix) result.streetNrSuffix = address.streetNrSuffix
    if (address.streetSuffix) result.streetSuffix = address.streetSuffix
    if (address.streetType) result.streetType = address.streetType
    if (address.geographicLocation)
      result.geographicLocation = address.geographicLocation

    if (subAddresses && subAddresses.length > 0) {
      result.geographicSubAddress = subAddresses.map((sub) =>
        this.transformSubAddress(sub)
      )
    }

    return result
  }

  private transformSubAddress(subAddress: any): GeographicSubAddressDto {
    const result: GeographicSubAddressDto = {
      id: subAddress.id,
      href: subAddress.href,
      '@type': subAddress.type
    }

    if (subAddress.baseType) result['@baseType'] = subAddress.baseType
    if (subAddress.schemaLocation) result['@schemaLocation'] = subAddress.schemaLocation
    if (subAddress.buildingName) result.buildingName = subAddress.buildingName
    if (subAddress.levelNumber) result.levelNumber = subAddress.levelNumber
    if (subAddress.levelType) result.levelType = subAddress.levelType
    if (subAddress.name) result.name = subAddress.name
    if (subAddress.privateStreetName)
      result.privateStreetName = subAddress.privateStreetName
    if (subAddress.privateStreetNumber)
      result.privateStreetNumber = subAddress.privateStreetNumber
    if (subAddress.subAddressType) result.subAddressType = subAddress.subAddressType
    if (subAddress.subUnitNumber) result.subUnitNumber = subAddress.subUnitNumber
    if (subAddress.subUnitType) result.subUnitType = subAddress.subUnitType

    return result
  }
}
