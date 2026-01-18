import { eq } from 'drizzle-orm'
import type { Database } from '../db/client'
import {
  contactMediums,
  parties,
  partyCharacteristics,
  relatedParties
} from '../db/schema'
import type {
  CreateIndividualRequest,
  IndividualDto,
  UpdateIndividualRequest
} from '../types'
import type { PaginationParams } from '@tm-forum/shared'
import { NotFoundError, type EventPublisher } from '@tm-forum/tmf-common'

export class IndividualService {
  private db: Database
  private baseUrl: string
  private eventPublisher?: EventPublisher

  constructor(db: Database, baseUrl: string, eventPublisher?: EventPublisher) {
    this.db = db
    this.baseUrl = baseUrl
    this.eventPublisher = eventPublisher
  }

  async createIndividual(data: CreateIndividualRequest): Promise<IndividualDto> {
    const [party] = await this.db
      .insert(parties)
      .values({
        partyType: 'Individual',
        type: 'Individual',
        givenName: data.givenName,
        familyName: data.familyName,
        middleName: data.middleName,
        fullName: data.fullName,
        formattedName: data.formattedName,
        birthDate: data.birthDate,
        deathDate: data.deathDate,
        gender: data.gender,
        title: data.title,
        maritalStatus: data.maritalStatus,
        nationality: data.nationality,
        placeOfBirth: data.placeOfBirth,
        countryOfBirth: data.countryOfBirth,
        location: data.location,
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

    const individual = await this.findIndividualById(party.id)

    if (this.eventPublisher) {
      const event = this.eventPublisher.createEvent({
        eventType: 'IndividualCreateEvent',
        domain: 'partyManagement',
        title: 'Individual created',
        description: `Individual ${individual.givenName ?? ''} ${individual.familyName ?? ''} has been created`,
        entityType: 'individual',
        entity: individual
      })
      await this.eventPublisher.publish(event)
    }

    return individual
  }

  async findIndividualById(id: string): Promise<IndividualDto> {
    const party = await this.db.query.parties.findFirst({
      where: eq(parties.id, id),
      with: {
        characteristics: true,
        contactMediums: true,
        relatedParties: true
      }
    })

    if (!party || party.partyType !== 'Individual') {
      throw new NotFoundError('Individual', id)
    }

    return this.transformIndividual(party)
  }

  async listIndividuals(
    pagination: PaginationParams
  ): Promise<{ items: IndividualDto[]; totalCount: number }> {
    const allParties = await this.db.query.parties.findMany({
      where: eq(parties.partyType, 'Individual'),
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
      .where(eq(parties.partyType, 'Individual'))

    return {
      items: allParties.map((p) => this.transformIndividual(p)),
      totalCount: countResult.length
    }
  }

  async updateIndividual(
    id: string,
    data: UpdateIndividualRequest
  ): Promise<IndividualDto> {
    const existing = await this.db.query.parties.findFirst({
      where: eq(parties.id, id)
    })

    if (!existing || existing.partyType !== 'Individual') {
      throw new NotFoundError('Individual', id)
    }

    await this.db
      .update(parties)
      .set({
        givenName: data.givenName ?? existing.givenName,
        familyName: data.familyName ?? existing.familyName,
        middleName: data.middleName ?? existing.middleName,
        fullName: data.fullName ?? existing.fullName,
        formattedName: data.formattedName ?? existing.formattedName,
        birthDate: data.birthDate ?? existing.birthDate,
        deathDate: data.deathDate ?? existing.deathDate,
        gender: data.gender ?? existing.gender,
        title: data.title ?? existing.title,
        maritalStatus: data.maritalStatus ?? existing.maritalStatus,
        nationality: data.nationality ?? existing.nationality,
        placeOfBirth: data.placeOfBirth ?? existing.placeOfBirth,
        countryOfBirth: data.countryOfBirth ?? existing.countryOfBirth,
        location: data.location ?? existing.location,
        status: data.status ?? existing.status,
        updatedAt: new Date()
      })
      .where(eq(parties.id, id))

    const individual = await this.findIndividualById(id)

    if (this.eventPublisher) {
      const event = this.eventPublisher.createEvent({
        eventType: 'IndividualAttributeValueChangeEvent',
        domain: 'partyManagement',
        title: 'Individual updated',
        description: `Individual ${individual.givenName ?? ''} ${individual.familyName ?? ''} has been updated`,
        entityType: 'individual',
        entity: individual
      })
      await this.eventPublisher.publish(event)
    }

    return individual
  }

  async deleteIndividual(id: string): Promise<void> {
    const existing = await this.db.query.parties.findFirst({
      where: eq(parties.id, id)
    })

    if (!existing || existing.partyType !== 'Individual') {
      throw new NotFoundError('Individual', id)
    }

    const individual = await this.findIndividualById(id)

    await this.db.delete(parties).where(eq(parties.id, id))

    if (this.eventPublisher) {
      const event = this.eventPublisher.createEvent({
        eventType: 'IndividualDeleteEvent',
        domain: 'partyManagement',
        title: 'Individual deleted',
        description: `Individual ${individual.givenName ?? ''} ${individual.familyName ?? ''} has been deleted`,
        entityType: 'individual',
        entity: { id }
      })
      await this.eventPublisher.publish(event)
    }
  }

  private transformIndividual(party: any): IndividualDto {
    const href = `${this.baseUrl}/tmf-api/partyManagement/v4/individual/${party.id}`

    return {
      id: party.id,
      href,
      '@type': 'Individual',
      '@baseType': 'Party',
      birthDate: party.birthDate,
      countryOfBirth: party.countryOfBirth,
      deathDate: party.deathDate,
      familyName: party.familyName,
      formattedName: party.formattedName,
      fullName: party.fullName,
      gender: party.gender,
      givenName: party.givenName,
      location: party.location,
      maritalStatus: party.maritalStatus,
      middleName: party.middleName,
      nationality: party.nationality,
      placeOfBirth: party.placeOfBirth,
      status: party.status,
      title: party.title,
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
