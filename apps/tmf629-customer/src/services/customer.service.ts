import { eq } from 'drizzle-orm'
import type { PaginationParams } from '@tm-forum/shared'
import {
  customers,
  customerCharacteristics,
  customerContactMediums,
  customerRelatedParties
} from '../db/schema'
import type {
  CreateCustomerRequest,
  CustomerDto,
  UpdateCustomerRequest
} from '../types'

export class CustomerService {
  constructor(
    private db: any,
    private baseUrl: string
  ) {}

  async createCustomer(data: CreateCustomerRequest): Promise<CustomerDto> {
    const { characteristic, contactMedium, relatedParty, ...customerData } = data

    const [customer] = await this.db
      .insert(customers)
      .values({
        type: data['@type'] ?? 'Customer',
        baseType: data['@baseType'],
        schemaLocation: data['@schemaLocation'],
        name: customerData.name,
        status: customerData.status,
        statusReason: customerData.statusReason,
        validForStart: customerData.validFor?.startDateTime
          ? new Date(customerData.validFor.startDateTime)
          : undefined,
        validForEnd: customerData.validFor?.endDateTime
          ? new Date(customerData.validFor.endDateTime)
          : undefined,
        engagedPartyId: customerData.engagedParty.id,
        engagedPartyHref: customerData.engagedParty.href,
        engagedPartyName: customerData.engagedParty.name,
        engagedPartyReferredType: customerData.engagedParty['@referredType']
      })
      .returning()

    const href = `${this.baseUrl}/tmf-api/customerManagement/v4/customer/${customer.id}`
    await this.db
      .update(customers)
      .set({ href })
      .where(eq(customers.id, customer.id))

    if (characteristic && characteristic.length > 0) {
      for (const char of characteristic) {
        await this.db.insert(customerCharacteristics).values({
          customerId: customer.id,
          name: char.name,
          value: char.value,
          valueType: char.valueType
        })
      }
    }

    if (contactMedium && contactMedium.length > 0) {
      for (const medium of contactMedium) {
        await this.db.insert(customerContactMediums).values({
          customerId: customer.id,
          mediumType: medium.mediumType,
          preferred: medium.preferred,
          characteristic: medium.characteristic,
          validForStart: medium.validFor?.startDateTime
            ? new Date(medium.validFor.startDateTime)
            : undefined,
          validForEnd: medium.validFor?.endDateTime
            ? new Date(medium.validFor.endDateTime)
            : undefined
        })
      }
    }

    if (relatedParty && relatedParty.length > 0) {
      for (const party of relatedParty) {
        await this.db.insert(customerRelatedParties).values({
          customerId: customer.id,
          referencedPartyId: party.id,
          referencedPartyHref: party.href,
          name: party.name,
          role: party.role,
          referredType: party['@referredType']
        })
      }
    }

    return this.findCustomerById(customer.id) as Promise<CustomerDto>
  }

  async findCustomerById(id: string): Promise<CustomerDto | null> {
    const [customer] = await this.db
      .select()
      .from(customers)
      .where(eq(customers.id, id))

    if (!customer) {
      return null
    }

    const characteristics = await this.db
      .select()
      .from(customerCharacteristics)
      .where(eq(customerCharacteristics.customerId, id))

    const contactMediums = await this.db
      .select()
      .from(customerContactMediums)
      .where(eq(customerContactMediums.customerId, id))

    const relatedParties = await this.db
      .select()
      .from(customerRelatedParties)
      .where(eq(customerRelatedParties.customerId, id))

    return this.transformCustomer(customer, characteristics, contactMediums, relatedParties)
  }

  async listCustomers(
    pagination: PaginationParams
  ): Promise<{ items: CustomerDto[]; totalCount: number }> {
    const allCustomers = await this.db.select().from(customers)
    const totalCount = allCustomers.length

    const paginatedCustomers = await this.db
      .select()
      .from(customers)
      .limit(pagination.limit)
      .offset(pagination.offset)

    const items = await Promise.all(
      paginatedCustomers.map(async (customer: any) => {
        const characteristics = await this.db
          .select()
          .from(customerCharacteristics)
          .where(eq(customerCharacteristics.customerId, customer.id))

        const contactMediums = await this.db
          .select()
          .from(customerContactMediums)
          .where(eq(customerContactMediums.customerId, customer.id))

        const relatedParties = await this.db
          .select()
          .from(customerRelatedParties)
          .where(eq(customerRelatedParties.customerId, customer.id))

        return this.transformCustomer(customer, characteristics, contactMediums, relatedParties)
      })
    )

    return { items, totalCount }
  }

  async updateCustomer(
    id: string,
    data: UpdateCustomerRequest
  ): Promise<CustomerDto | null> {
    const existing = await this.findCustomerById(id)
    if (!existing) {
      return null
    }

    const { characteristic, contactMedium, relatedParty, ...customerData } = data

    const updateData: any = {
      updatedAt: new Date()
    }

    if (customerData.name !== undefined) updateData.name = customerData.name
    if (customerData.status !== undefined) updateData.status = customerData.status
    if (customerData.statusReason !== undefined)
      updateData.statusReason = customerData.statusReason
    if (customerData.validFor?.startDateTime !== undefined)
      updateData.validForStart = new Date(customerData.validFor.startDateTime)
    if (customerData.validFor?.endDateTime !== undefined)
      updateData.validForEnd = new Date(customerData.validFor.endDateTime)
    if (customerData.engagedParty) {
      updateData.engagedPartyId = customerData.engagedParty.id
      updateData.engagedPartyHref = customerData.engagedParty.href
      updateData.engagedPartyName = customerData.engagedParty.name
      updateData.engagedPartyReferredType = customerData.engagedParty['@referredType']
    }

    await this.db.update(customers).set(updateData).where(eq(customers.id, id))

    if (characteristic) {
      await this.db
        .delete(customerCharacteristics)
        .where(eq(customerCharacteristics.customerId, id))

      for (const char of characteristic) {
        await this.db.insert(customerCharacteristics).values({
          customerId: id,
          name: char.name,
          value: char.value,
          valueType: char.valueType
        })
      }
    }

    if (contactMedium) {
      await this.db
        .delete(customerContactMediums)
        .where(eq(customerContactMediums.customerId, id))

      for (const medium of contactMedium) {
        await this.db.insert(customerContactMediums).values({
          customerId: id,
          mediumType: medium.mediumType,
          preferred: medium.preferred,
          characteristic: medium.characteristic,
          validForStart: medium.validFor?.startDateTime
            ? new Date(medium.validFor.startDateTime)
            : undefined,
          validForEnd: medium.validFor?.endDateTime
            ? new Date(medium.validFor.endDateTime)
            : undefined
        })
      }
    }

    if (relatedParty) {
      await this.db
        .delete(customerRelatedParties)
        .where(eq(customerRelatedParties.customerId, id))

      for (const party of relatedParty) {
        await this.db.insert(customerRelatedParties).values({
          customerId: id,
          referencedPartyId: party.id,
          referencedPartyHref: party.href,
          name: party.name,
          role: party.role,
          referredType: party['@referredType']
        })
      }
    }

    return this.findCustomerById(id)
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const existing = await this.findCustomerById(id)
    if (!existing) {
      return false
    }

    await this.db.delete(customers).where(eq(customers.id, id))
    return true
  }

  private transformCustomer(
    customer: any,
    characteristics: any[],
    contactMediums: any[],
    relatedParties: any[]
  ): CustomerDto {
    const result: CustomerDto = {
      id: customer.id,
      href: customer.href,
      '@type': customer.type,
      engagedParty: {
        id: customer.engagedPartyId,
        '@referredType': customer.engagedPartyReferredType
      }
    }

    if (customer.baseType) result['@baseType'] = customer.baseType
    if (customer.schemaLocation) result['@schemaLocation'] = customer.schemaLocation
    if (customer.name) result.name = customer.name
    if (customer.status) result.status = customer.status
    if (customer.statusReason) result.statusReason = customer.statusReason
    if (customer.engagedPartyHref) result.engagedParty.href = customer.engagedPartyHref
    if (customer.engagedPartyName) result.engagedParty.name = customer.engagedPartyName

    if (customer.validForStart || customer.validForEnd) {
      result.validFor = {}
      if (customer.validForStart) {
        result.validFor.startDateTime = customer.validForStart.toISOString()
      }
      if (customer.validForEnd) {
        result.validFor.endDateTime = customer.validForEnd.toISOString()
      }
    }

    if (characteristics && characteristics.length > 0) {
      result.characteristic = characteristics.map((char) => ({
        id: char.id,
        name: char.name,
        value: char.value,
        valueType: char.valueType
      }))
    }

    if (contactMediums && contactMediums.length > 0) {
      result.contactMedium = contactMediums.map((medium) => {
        const cm: any = {
          id: medium.id,
          mediumType: medium.mediumType,
          preferred: medium.preferred,
          characteristic: medium.characteristic
        }
        if (medium.validForStart || medium.validForEnd) {
          cm.validFor = {}
          if (medium.validForStart) {
            cm.validFor.startDateTime = medium.validForStart.toISOString()
          }
          if (medium.validForEnd) {
            cm.validFor.endDateTime = medium.validForEnd.toISOString()
          }
        }
        return cm
      })
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
