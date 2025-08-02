//lib/schemas/notification.schema.ts
import { Schema, model, models, Document } from 'mongoose';

export interface INotification extends Document {
  _id: string;
  userId: Schema.Types.ObjectId;
  type: 'ticket_created' | 'ticket_updated' | 'ticket_assigned' | 'comment_added' | 'mention' | 'sla_breach' | 'escalation' | 'approval_request' | 'system_announcement';
  title: string;
  message: string;
  data: {
    ticketId?: Schema.Types.ObjectId;
    activityId?: Schema.Types.ObjectId;
    url?: string;
    [key: string]: any;
  };
  channels: {
    email: {
      sent: boolean;
      sentAt?: Date;
      error?: string;
    };
    browser: {
      sent: boolean;
      sentAt?: Date;
      read: boolean;
      readAt?: Date;
    };
    sms: {
      sent: boolean;
      sentAt?: Date;
      error?: string;
    };
  };
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  readAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['ticket_created', 'ticket_updated', 'ticket_assigned', 'comment_added', 'mention', 'sla_breach', 'escalation', 'approval_request', 'system_announcement'],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  data: {
    type: Schema.Types.Mixed,
    default: {}
  },
  channels: {
    email: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    },
    browser: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      read: { type: Boolean, default: false },
      readAt: Date
    },
    sms: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      error: String
    }
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: Date,
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for notification queries
notificationSchema.index({ userId: 1, isRead: 1, priority: 1, createdAt: -1 });

export const Notification = models.Notification || model<INotification>('Notification', notificationSchema);