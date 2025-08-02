//lib/schemas/webhook.schema.ts
import { Schema, model, models, Document } from 'mongoose';

export interface IWebhook extends Document {
  _id: string;
  name: string;
  url: string;
  secret: string;
  events: WebhookEvent[];
  isActive: boolean;
  headers: Record<string, string>;
  retryPolicy: {
    maxRetries: number;
    retryDelay: number; // milliseconds
    backoffMultiplier: number;
  };
  timeout: number; // milliseconds
  lastTriggered?: Date;
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type WebhookEvent = 
  | 'ticket.created'
  | 'ticket.updated'
  | 'ticket.status_changed'
  | 'ticket.assigned'
  | 'ticket.priority_changed'
  | 'ticket.resolved'
  | 'ticket.closed'
  | 'ticket.reopened'
  | 'ticket.comment_added'
  | 'ticket.escalated'
  | 'ticket.sla_breached'
  | 'user.created'
  | 'user.updated'
  | 'team.created'
  | 'team.updated';

const webhookSchema = new Schema<IWebhook>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    validate: {
      validator: function(v: string) {
        try {
          new URL(v);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Invalid URL format'
    }
  },
  secret: {
    type: String,
    required: true,
    minlength: 16
  },
  events: [{
    type: String,
    enum: [
      'ticket.created',
      'ticket.updated', 
      'ticket.status_changed',
      'ticket.assigned',
      'ticket.priority_changed',
      'ticket.resolved',
      'ticket.closed',
      'ticket.reopened',
      'ticket.comment_added',
      'ticket.escalated',
      'ticket.sla_breached',
      'user.created',
      'user.updated',
      'team.created',
      'team.updated'
    ],
    required: true
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  headers: {
    type: Schema.Types.Mixed,
    default: {}
  },
  retryPolicy: {
    maxRetries: {
      type: Number,
      default: 3,
      min: 0,
      max: 10
    },
    retryDelay: {
      type: Number,
      default: 1000,
      min: 100
    },
    backoffMultiplier: {
      type: Number,
      default: 2,
      min: 1
    }
  },
  timeout: {
    type: Number,
    default: 30000,
    min: 1000,
    max: 300000
  },
  lastTriggered: Date,
  totalDeliveries: {
    type: Number,
    default: 0
  },
  successfulDeliveries: {
    type: Number,
    default: 0
  },
  failedDeliveries: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
webhookSchema.index({ isActive: 1, events: 1 });
webhookSchema.index({ createdBy: 1 });
webhookSchema.index({ url: 1 });

// Virtual for success rate
webhookSchema.virtual('successRate').get(function() {
  if (this.totalDeliveries === 0) return 0;
  return (this.successfulDeliveries / this.totalDeliveries) * 100;
});

export const Webhook = models.Webhook || model<IWebhook>('Webhook', webhookSchema);