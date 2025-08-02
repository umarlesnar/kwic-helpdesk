//lib/schemas/ticket.schema.ts
import { Schema, model, models, Document } from 'mongoose';

export interface ITicket extends Document {
  _id: string;
  ticketNumber: string;
  title: string;
  description: string;
  requestTypeId: Schema.Types.ObjectId;
  customerId: Schema.Types.ObjectId;
  assigneeId?: Schema.Types.ObjectId;
  status: 'open' | 'in_progress' | 'waiting_for_customer' | 'waiting_for_support' | 'pending' | 'reopened' | 'resolved' | 'closed' | 'cancelled' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'critical';
  labels: string[];
  teamId?: Schema.Types.ObjectId;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  source: 'web' | 'email' | 'phone' | 'chat' | 'api';
  channel: string;
  customFields: {
    [key: string]: any;
  };
  attachments: {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    uploadedBy: Schema.Types.ObjectId;
    uploadedAt: Date;
  }[];
  watchers: Schema.Types.ObjectId[];
  participants: Schema.Types.ObjectId[];
  approvers: {
    userId: Schema.Types.ObjectId;
    status: 'pending' | 'approved' | 'rejected';
    comment?: string;
    approvedAt?: Date;
  }[];
  sla: {
    responseDeadline: Date;
    resolutionDeadline: Date;
    isBreached: boolean;
    breachedAt?: Date;
  };
  satisfaction: {
    rating?: number;
    comment?: string;
    submittedAt?: Date;
  };
  metrics: {
    firstResponseTime?: number; // minutes
    resolutionTime?: number; // minutes
    reopenCount: number;
    escalationCount: number;
  };
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  closedAt?: Date;
}

const ticketSchema = new Schema<ITicket>({
  ticketNumber: {
    type: String,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    index: 'text'
  },
  description: {
    type: String,
    required: true,
    index: 'text'
  },
  requestTypeId: {
    type: Schema.Types.ObjectId,
    ref: 'RequestType',
    required: true,
    index: true
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  assigneeId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'waiting_for_customer', 'waiting_for_support', 'pending', 'reopened', 'resolved', 'closed', 'cancelled', 'escalated'],
    default: 'open',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  labels: [{
    type: String,
    trim: true
  }],
  teamId: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    index: true
  },
  dueDate: {
    type: Date,
    index: true
  },
  estimatedHours: Number,
  actualHours: Number,
  source: {
    type: String,
    enum: ['web', 'email', 'phone', 'chat', 'api'],
    default: 'web'
  },
  channel: {
    type: String,
    default: 'web'
  },
  customFields: {
    type: Schema.Types.Mixed,
    default: {}
  },
  attachments: [{
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now }
  }],
  watchers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  approvers: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    comment: String,
    approvedAt: Date
  }],
  sla: {
    responseDeadline: Date,
    resolutionDeadline: Date,
    isBreached: { type: Boolean, default: false },
    breachedAt: Date
  },
  satisfaction: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    submittedAt: Date
  },
  metrics: {
    firstResponseTime: Number,
    resolutionTime: Number,
    reopenCount: { type: Number, default: 0 },
    escalationCount: { type: Number, default: 0 }
  },
  resolvedAt: Date,
  closedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
ticketSchema.index({ customerId: 1, status: 1 });
ticketSchema.index({ assigneeId: 1, status: 1 });
ticketSchema.index({ teamId: 1, status: 1 });
ticketSchema.index({ priority: 1, status: 1 });
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ updatedAt: -1 });
ticketSchema.index({ dueDate: 1, status: 1 });
ticketSchema.index({ 'sla.responseDeadline': 1, status: 1 });
ticketSchema.index({ 'sla.resolutionDeadline': 1, status: 1 });

// Compound indexes for common queries
ticketSchema.index({ status: 1, priority: 1, createdAt: -1 });
ticketSchema.index({ customerId: 1, createdAt: -1 });
ticketSchema.index({ assigneeId: 1, createdAt: -1 });

// Text index for search
ticketSchema.index({ title: 'text', description: 'text' });

// Pre-save middleware to generate ticket number
ticketSchema.pre('save', async function(next) {
  if (this.isNew && !this.ticketNumber) {
    const model = this.constructor as typeof Ticket;
    const count = await model.countDocuments();
    this.ticketNumber = `TKT-${String(count + 1).padStart(6, '0')}`; //TKT Number of digits can be adjusted
  }
  next();
});

// Virtual for age in days
ticketSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
});

// Virtual for is overdue
ticketSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate) return false;
  return Date.now() > this.dueDate.getTime() && !['resolved', 'closed', 'cancelled'].includes(this.status);
});

export const Ticket = models.Ticket || model<ITicket>('Ticket', ticketSchema);