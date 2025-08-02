//lib/schemas/webhookDelivery.schema.ts
import { Schema, model, models, Document } from 'mongoose';

export interface IWebhookDelivery extends Document {
  _id: string;
  webhookId: Schema.Types.ObjectId;
  event: string;
  payload: any;
  url: string;
  httpMethod: string;
  headers: Record<string, string>;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  responseStatus?: number;
  responseBody?: string;
  responseHeaders?: Record<string, string>;
  errorMessage?: string;
  attempts: {
    attemptNumber: number;
    timestamp: Date;
    responseStatus?: number;
    responseTime: number; // milliseconds
    errorMessage?: string;
  }[];
  nextRetryAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const webhookDeliverySchema = new Schema<IWebhookDelivery>({
  webhookId: {
    type: Schema.Types.ObjectId,
    ref: 'Webhook',
    required: true,
    index: true
  },
  event: {
    type: String,
    required: true,
    index: true
  },
  payload: {
    type: Schema.Types.Mixed,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  httpMethod: {
    type: String,
    default: 'POST',
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  },
  headers: {
    type: Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'retrying'],
    default: 'pending',
    index: true
  },
  responseStatus: Number,
  responseBody: String,
  responseHeaders: Schema.Types.Mixed,
  errorMessage: String,
  attempts: [{
    attemptNumber: {
      type: Number,
      required: true
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    },
    responseStatus: Number,
    responseTime: {
      type: Number,
      required: true
    },
    errorMessage: String
  }],
  nextRetryAt: {
    type: Date,
    index: true
  },
  deliveredAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
webhookDeliverySchema.index({ webhookId: 1, createdAt: -1 });
webhookDeliverySchema.index({ status: 1, nextRetryAt: 1 });
webhookDeliverySchema.index({ event: 1, createdAt: -1 });

// TTL index to automatically delete old deliveries (optional)
webhookDeliverySchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

export const WebhookDelivery = models.WebhookDelivery || model<IWebhookDelivery>('WebhookDelivery', webhookDeliverySchema);