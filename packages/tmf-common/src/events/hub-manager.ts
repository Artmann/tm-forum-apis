import type { HubSubscription, CreateHubSubscriptionRequest } from './types'

export interface HubManagerStorage {
  create(subscription: HubSubscription): Promise<HubSubscription>
  findById(id: string): Promise<HubSubscription | undefined>
  delete(id: string): Promise<boolean>
  list(): Promise<HubSubscription[]>
}

export class InMemoryHubStorage implements HubManagerStorage {
  private subscriptions: Map<string, HubSubscription> = new Map()

  async create(subscription: HubSubscription): Promise<HubSubscription> {
    this.subscriptions.set(subscription.id, subscription)
    return subscription
  }

  async findById(id: string): Promise<HubSubscription | undefined> {
    return this.subscriptions.get(id)
  }

  async delete(id: string): Promise<boolean> {
    return this.subscriptions.delete(id)
  }

  async list(): Promise<HubSubscription[]> {
    return Array.from(this.subscriptions.values())
  }
}

export class HubManager {
  private storage: HubManagerStorage

  constructor(storage?: HubManagerStorage) {
    this.storage = storage ?? new InMemoryHubStorage()
  }

  async createSubscription(
    request: CreateHubSubscriptionRequest
  ): Promise<HubSubscription> {
    const subscription: HubSubscription = {
      id: crypto.randomUUID(),
      callback: request.callback,
      query: request.query
    }

    return this.storage.create(subscription)
  }

  async findSubscriptionById(id: string): Promise<HubSubscription | undefined> {
    return this.storage.findById(id)
  }

  async deleteSubscription(id: string): Promise<boolean> {
    return this.storage.delete(id)
  }

  async listSubscriptions(): Promise<HubSubscription[]> {
    return this.storage.list()
  }

  async deliverEvent<T>(event: T): Promise<void> {
    const subscriptions = await this.listSubscriptions()

    const deliveryPromises = subscriptions.map(async (subscription) => {
      try {
        await fetch(subscription.callback, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(event)
        })
      } catch (error) {
        console.error(
          `Failed to deliver event to ${subscription.callback}:`,
          error
        )
      }
    })

    await Promise.allSettled(deliveryPromises)
  }
}

export function createHubManager(storage?: HubManagerStorage): HubManager {
  return new HubManager(storage)
}
