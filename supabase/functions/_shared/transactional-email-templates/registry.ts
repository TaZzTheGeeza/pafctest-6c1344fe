/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as paymentRequestCreated } from './payment-request-created.tsx'
import { template as newChatMessage } from './new-chat-message.tsx'
import { template as availabilityEventAdded } from './availability-event-added.tsx'
import { template as teamSelectionPublished } from './team-selection-published.tsx'
import { template as adminBroadcast } from './admin-broadcast.tsx'
import { template as shopOrderNotification } from './shop-order-notification.tsx'
import { template as meetingInvite } from './meeting-invite.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'payment-request-created': paymentRequestCreated,
  'new-chat-message': newChatMessage,
  'availability-event-added': availabilityEventAdded,
  'team-selection-published': teamSelectionPublished,
  'admin-broadcast': adminBroadcast,
  'shop-order-notification': shopOrderNotification,
}
