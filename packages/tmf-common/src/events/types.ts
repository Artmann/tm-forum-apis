import type { TMForumEvent, EventType } from '@tm-forum/shared'

export type { TMForumEvent, EventType }

export interface EventPublisherOptions {
  redisUrl?: string
  channel: string
}

export interface HubSubscription {
  id: string
  callback: string
  query?: string
}

export interface CreateHubSubscriptionRequest {
  callback: string
  query?: string
}
