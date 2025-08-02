//lib/schemas/ticketActivity.schema.ts
import { Schema, model, models, Document } from 'mongoose';

export interface ITicketActivity extends Document {
  _id: string;
  ticketId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  type: 'comment' | 'status_change' | 'assignment' | 'priority_change' | 'label_change' | 'attachment' | 'escalation' | 'approval' | 'merge' | 'split';
  content?: string;
  isInternal: boolean;
  metadata: {
    oldValue?: any;
    newValue?: any;
    fieldName?: string;
    attachmentId?: string;
    mergedTicketIds?: string[];
    splitTicketIds?: string[];
    [key: string]: any;
  };
  mentions: Schema.Types.ObjectId[];
  attachments: {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
  }[];
  reactions: {
    userId: Schema.Types.ObjectId;
    emoji: string;
    createdAt: Date;
  }[];
  isEdited: boolean;
  editedAt?: Date;
  editHistory: {
    content: string;
    editedAt: Date;
    editedBy: Schema.Types.ObjectId;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const ticketActivitySchema = new Schema<ITicketActivity>({
  ticketId: {
    type: Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['comment', 'status_change', 'assignment', 'priority_change', 'label_change', 'attachment', 'escalation', 'approval', 'merge', 'split'],
    required: true,
    index: true
  },
  content: {
    type: String,
    trim: true
  },
  isInternal: {
    type: Boolean,
    default: false,
    index: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  mentions: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  attachments: [{
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true }
  }],
  reactions: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    emoji: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  editHistory: [{
    content: { type: String, required: true },
    editedAt: { type: Date, required: true },
    editedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
ticketActivitySchema.index({ ticketId: 1, createdAt: -1 });
ticketActivitySchema.index({ userId: 1, createdAt: -1 });
ticketActivitySchema.index({ type: 1, createdAt: -1 });
ticketActivitySchema.index({ ticketId: 1, type: 1, createdAt: -1 });
ticketActivitySchema.index({ ticketId: 1, isInternal: 1, createdAt: -1 });

// Compound index for activity feed queries
ticketActivitySchema.index({ ticketId: 1, isInternal: 1, type: 1, createdAt: -1 });

export const TicketActivity = models.TicketActivity || model<ITicketActivity>('TicketActivity', ticketActivitySchema, 'ticket_activities');