import Redis from 'ioredis'
import type { TMForumEvent, EventPublisherOptions } from './types'

export class EventPublisher {
  private redis: Redis
  private channel: string

  constructor(options: EventPublisherOptions) {
    const redisUrl = options.redisUrl ?? process.env.REDIS_URL ?? 'redis://localhost:6379'
    this.redis = new Redis(redisUrl)
    this.channel = options.channel
  }

  async publish<T>(event: TMForumEvent<T>): Promise<void> {
    const message = JSON.stringify(event)
    await this.redis.publish(this.channel, message)
  }

  async close(): Promise<void> {
    await this.redis.quit()
  }

  createEvent<T>(options: {
    eventType: string
    domain: string
    title: string
    entityType: string
    entity: T
    correlationId?: string
    description?: string
  }): TMForumEvent<T> {
    return {
      eventId: crypto.randomUUID(),
      eventTime: new Date().toISOString(),
      eventType: options.eventType,
      correlationId: options.correlationId,
      domain: options.domain,
      title: options.title,
      description: options.description,
      event: {
        [options.entityType]: options.entity
      }
    }
  }
}

export function createEventPublisher(options: EventPublisherOptions): EventPublisher {
  return new EventPublisher(options)
}
