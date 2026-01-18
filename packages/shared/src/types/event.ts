export interface TMForumEvent<T> {
  eventId: string
  eventTime: string
  eventType: string
  correlationId?: string
  domain: string
  title: string
  description?: string
  event: {
    [key: string]: T
  }
}

export type EventType =
  | 'CreateEvent'
  | 'AttributeValueChangeEvent'
  | 'StateChangeEvent'
  | 'DeleteEvent'
