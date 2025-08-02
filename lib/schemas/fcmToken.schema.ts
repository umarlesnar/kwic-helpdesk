//lib/schemas/fcmToken.schema.ts
import { Schema, model, models, Document } from 'mongoose';

export interface IFCMToken extends Document {
  _id: string;
  userId: Schema.Types.ObjectId;
  token: string;
  deviceInfo?: {
    platform?: string;
    browser?: string;
    version?: string;
    userAgent?: string;
  };
  isActive: boolean;
  lastUsed: Date;
  createdAt: Date;
  updatedAt: Date;
}

const fcmTokenSchema = new Schema<IFCMToken>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  deviceInfo: {
    platform: String,
    browser: String,
    version: String,
    userAgent: String
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastUsed: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
fcmTokenSchema.index({ userId: 1, isActive: 1 });
fcmTokenSchema.index({ token: 1 }, { unique: true });
fcmTokenSchema.index({ lastUsed: 1 });

// TTL index to clean up old inactive tokens
fcmTokenSchema.index({ lastUsed: 1 }, { 
  expireAfterSeconds: 7776000, // 90 days
  partialFilterExpression: { isActive: false }
});

export const FCMToken = models.FCMToken || model<IFCMToken>('FCMToken', fcmTokenSchema);