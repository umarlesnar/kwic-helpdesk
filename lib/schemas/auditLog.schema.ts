//lib/schemas/auditLog.schema.ts
import { Schema, model, models, Document } from 'mongoose';

export interface IAuditLog extends Document {
  _id: string;
  userId?: Schema.Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: string;
  details: {
    oldValues?: any;
    newValues?: any;
    metadata?: any;
    [key: string]: any;
  };
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'authorization' | 'data_modification' | 'system_configuration' | 'user_management' | 'ticket_management' | 'security';
  success: boolean;
  errorMessage?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  resource: {
    type: String,
    required: true,
    index: true
  },
  resourceId: {
    type: String,
    index: true
  },
  details: {
    type: Schema.Types.Mixed,
    default: {}
  },
  ipAddress: String,
  userAgent: String,
  sessionId: String,
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
    index: true
  },
  category: {
    type: String,
    enum: ['authentication', 'authorization', 'data_modification', 'system_configuration', 'user_management', 'ticket_management', 'security'],
    required: true,
    index: true
  },
  success: {
    type: Boolean,
    required: true,
    index: true
  },
  errorMessage: String
}, {
  timestamps: { createdAt: true, updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, createdAt: -1 });
auditLogSchema.index({ category: 1, severity: 1, createdAt: -1 });
auditLogSchema.index({ success: 1, createdAt: -1 });

// Compound indexes for common queries
auditLogSchema.index({ userId: 1, category: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1, createdAt: -1 });

// TTL index to automatically delete old logs (optional)
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 }); // 1 year

export const AuditLog = models.AuditLog || model<IAuditLog>('AuditLog', auditLogSchema, 'audit_logs');