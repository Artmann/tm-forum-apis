import { eq } from 'drizzle-orm'
import type { Database } from '../db/client'
import {
  contactMediums,
  parties,
  partyCharacteristics,
  relatedParties
} from '../db/schema'
import type {
  CreateOrganizationRequest,
  OrganizationDto,
  UpdateOrganizationRequest
} from '../types'
import type { PaginationParams } from '@tm-forum/shared'
import { NotFoundError } from '@tm-forum/tmf-common'

export class OrganizationService {
  private db: Database
  private baseUrl: string

  constructor(db: Database, baseUrl: string) {
    this.db = db
    this.baseUrl = baseUrl
  }

  async createOrganization(
    data: CreateOrganizationRequest
  ): Promise<OrganizationDto> {
    const [party] = await this.db
      .insert(parties)
      .values({
        partyType: 'Organization',
        type: 'Organization',
        name: data.name,
        nameType: data.nameType,
        organizationType: data.organizationType,
        tradingName: data.tradingName,
        isHeadOffice: data.isHeadOffice,
        isLegalEntity: data.isLegalEntity,
        status: data.status,
        validForStart: data.validFor?.startDateTime
          ? new Date(data.validFor.startDateTime)
          : undefined,
        validForEnd: data.validFor?.endDateTime
          ? new Date(data.validFor.endDateTime)
          : undefined
      })
      .returning()

    if (data.partyCharacteristic?.length) {
      await this.db.insert(partyCharacteristics).values(
        data.partyCharacteristic.map((c) => ({
          partyId: party.id,
          name: c.name,
          value: c.value,
          valueType: c.valueType
        }))
      )
    }

    if (data.contactMedium?.length) {
      await this.db.insert(contactMediums).values(
        data.contactMedium.map((cm) => ({
          partyId: party.id,
          mediumType: cm.mediumType,
          preferred: cm.preferred,
          characteristic: cm.characteristic,
          validForStart: cm.validFor?.startDateTime
            ? new Date(cm.validFor.startDateTime)
            : undefined,
          validForEnd: cm.validFor?.endDateTime
            ? new Date(cm.validFor.endDateTime)
            : undefined
        }))
      )
    }

    if (data.relatedParty?.length) {
      await this.db.insert(relatedParties).values(
        data.relatedParty.map((rp) => ({
          sourcePartyId: party.id,
          referencedPartyId: rp.id,
          referencedPartyHref: rp.href,
          name: rp.name,
          role: rp.role,
          referredType: rp['@referredType']
        }))
      )
    }

    return this.findOrganizationById(party.id)
  }

  async findOrganizationById(id: string): Promise<OrganizationDto> {
    const party = await this.db.query.parties.findFirst({
      where: eq(parties.id, id),
      with: {
        characteristics: true,
        contactMediums: true,
        relatedParties: true
      }
    })

    if (!party || party.partyType !== 'Organization') {
      throw new NotFoundError('Organization', id)
    }

    return this.transformOrganization(party)
  }

  async listOrganizations(
    pagination: PaginationParams
  ): Promise<{ items: OrganizationDto[]; totalCount: number }> {
    const allParties = await this.db.query.parties.findMany({
      where: eq(parties.partyType, 'Organization'),
      with: {
        characteristics: true,
        contactMediums: true,
        relatedParties: true
      },
      offset: pagination.offset,
      limit: pagination.limit
    })

    const countResult = await this.db
      .select()
      .from(parties)
      .where(eq(parties.partyType, 'Organization'))

    return {
      items: allParties.map((p) => this.transformOrganization(p)),
      totalCount: countResult.length
    }
  }

  async updateOrganization(
    id: string,
    data: UpdateOrganizationRequest
  ): Promise<OrganizationDto> {
    const existing = await this.db.query.parties.findFirst({
      where: eq(parties.id, id)
    })

    if (!existing || existing.partyType !== 'Organization') {
      throw new NotFoundError('Organization', id)
    }

    await this.db
      .update(parties)
      .set({
        name: data.name ?? existing.name,
        nameType: data.nameType ?? existing.nameType,
        organizationType: data.organizationType ?? existing.organizationType,
        tradingName: data.tradingName ?? existing.tradingName,
        isHeadOffice: data.isHeadOffice ?? existing.isHeadOffice,
        isLegalEntity: data.isLegalEntity ?? existing.isLegalEntity,
        status: data.status ?? existing.status,
        updatedAt: new Date()
      })
      .where(eq(parties.id, id))

    return this.findOrganizationById(id)
  }

  async deleteOrganization(id: string): Promise<void> {
    const existing = await this.db.query.parties.findFirst({
      where: eq(parties.id, id)
    })

    if (!existing || existing.partyType !== 'Organization') {
      throw new NotFoundError('Organization', id)
    }

    await this.db.delete(parties).where(eq(parties.id, id))
  }

  private transformOrganization(party: any): OrganizationDto {
    const href = `${this.baseUrl}/tmf-api/partyManagement/v4/organization/${party.id}`

    return {
      id: party.id,
      href,
      '@type': 'Organization',
      '@baseType': 'Party',
      isHeadOffice: party.isHeadOffice,
      isLegalEntity: party.isLegalEntity,
      name: party.name,
      nameType: party.nameType,
      organizationType: party.organizationType,
      status: party.status,
      tradingName: party.tradingName,
      validFor:
        party.validForStart || party.validForEnd
          ? {
              startDateTime: party.validForStart?.toISOString(),
              endDateTime: party.validForEnd?.toISOString()
            }
          : undefined,
      partyCharacteristic: party.characteristics?.map((c: any) => ({
        id: c.id,
        name: c.name,
        value: c.value,
        valueType: c.valueType
      })),
      contactMedium: party.contactMediums?.map((cm: any) => ({
        id: cm.id,
        mediumType: cm.mediumType,
        preferred: cm.preferred,
        characteristic: cm.characteristic,
        validFor:
          cm.validForStart || cm.validForEnd
            ? {
                startDateTime: cm.validForStart?.toISOString(),
                endDateTime: cm.validForEnd?.toISOString()
              }
            : undefined
      })),
      relatedParty: party.relatedParties?.map((rp: any) => ({
        id: rp.referencedPartyId,
        href: rp.referencedPartyHref,
        name: rp.name,
        role: rp.role,
        '@referredType': rp.referredType
      }))
    }
  }
}
