import { eq } from 'drizzle-orm'
import type { Database } from '../db/client'
import { eventSubscriptions } from '../db/schema'
import { NotFoundError } from '@tm-forum/tmf-common'

export interface HubSubscription {
  id: string
  callback: string
  query?: string
}

export interface CreateHubSubscriptionRequest {
  callback: string
  query?: string
}

export class HubService {
  private db: Database

  constructor(db: Database) {
    this.db = db
  }

  async createSubscription(
    data: CreateHubSubscriptionRequest
  ): Promise<HubSubscription> {
    const [subscription] = await this.db
      .insert(eventSubscriptions)
      .values({
        callback: data.callback,
        query: data.query
      })
      .returning()

    return {
      id: subscription.id,
      callback: subscription.callback,
      query: subscription.query ?? undefined
    }
  }

  async findSubscriptionById(id: string): Promise<HubSubscription> {
    const subscription = await this.db.query.eventSubscriptions.findFirst({
      where: eq(eventSubscriptions.id, id)
    })

    if (!subscription) {
      throw new NotFoundError('HubSubscription', id)
    }

    return {
      id: subscription.id,
      callback: subscription.callback,
      query: subscription.query ?? undefined
    }
  }

  async deleteSubscription(id: string): Promise<void> {
    const existing = await this.db.query.eventSubscriptions.findFirst({
      where: eq(eventSubscriptions.id, id)
    })

    if (!existing) {
      throw new NotFoundError('HubSubscription', id)
    }

    await this.db.delete(eventSubscriptions).where(eq(eventSubscriptions.id, id))
  }
}
