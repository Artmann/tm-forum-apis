import { eq } from 'drizzle-orm'
import { eventSubscriptions } from '../db/schema'

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
  constructor(private db: any) {}

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

  async deleteSubscription(id: string): Promise<boolean> {
    const [existing] = await this.db
      .select()
      .from(eventSubscriptions)
      .where(eq(eventSubscriptions.id, id))

    if (!existing) {
      return false
    }

    await this.db
      .delete(eventSubscriptions)
      .where(eq(eventSubscriptions.id, id))

    return true
  }
}
