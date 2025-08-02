//lib/schemas/team.schema.ts
import { Schema, model, models, Document } from 'mongoose';
export interface ITeam extends Document {
  _id: string;
  name: string;
  description?: string;
  members: Schema.Types.ObjectId[];
  requestTypes: Schema.Types.ObjectId[];
  leadId?: Schema.Types.ObjectId;
  isActive: boolean;
  settings: {
    autoAssignment: boolean;
    workingHours: {
      timezone: string;
      schedule: {
        monday: { enabled: boolean; start: string; end: string; };
        tuesday: { enabled: boolean; start: string; end: string; };
        wednesday: { enabled: boolean; start: string; end: string; };
        thursday: { enabled: boolean; start: string; end: string; };
        friday: { enabled: boolean; start: string; end: string; };
        saturday: { enabled: boolean; start: string; end: string; };
        sunday: { enabled: boolean; start: string; end: string; };
      };
    };
    escalationRules: {
      priority: 'low' | 'medium' | 'high' | 'critical';
      hoursBeforeEscalation: number;
      escalateTo: 'team_lead' | 'manager' | 'admin';
    }[];
  };
  metrics: {
    totalTickets: number;
    resolvedTickets: number;
    avgResolutionTime: number;
    customerSatisfaction: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new Schema<ITeam>({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  requestTypes: [{
    type: Schema.Types.ObjectId,
    ref: 'RequestType'
  }],
  leadId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  settings: {
    autoAssignment: {
      type: Boolean,
      default: true
    },
    workingHours: {
      timezone: {
        type: String,
        default: 'UTC'
      },
      schedule: {
        monday: {
          enabled: { type: Boolean, default: true },
          start: { type: String, default: '09:00' },
          end: { type: String, default: '17:00' }
        },
        tuesday: {
          enabled: { type: Boolean, default: true },
          start: { type: String, default: '09:00' },
          end: { type: String, default: '17:00' }
        },
        wednesday: {
          enabled: { type: Boolean, default: true },
          start: { type: String, default: '09:00' },
          end: { type: String, default: '17:00' }
        },
        thursday: {
          enabled: { type: Boolean, default: true },
          start: { type: String, default: '09:00' },
          end: { type: String, default: '17:00' }
        },
        friday: {
          enabled: { type: Boolean, default: true },
          start: { type: String, default: '09:00' },
          end: { type: String, default: '17:00' }
        },
        saturday: {
          enabled: { type: Boolean, default: false },
          start: { type: String, default: '09:00' },
          end: { type: String, default: '17:00' }
        },
        sunday: {
          enabled: { type: Boolean, default: false },
          start: { type: String, default: '09:00' },
          end: { type: String, default: '17:00' }
        }
      }
    },
    escalationRules: [{
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true
      },
      hoursBeforeEscalation: {
        type: Number,
        required: true
      },
      escalateTo: {
        type: String,
        enum: ['team_lead', 'manager', 'admin'],
        required: true
      }
    }]
  },
  metrics: {
    totalTickets: { type: Number, default: 0 },
    resolvedTickets: { type: Number, default: 0 },
    avgResolutionTime: { type: Number, default: 0 },
    customerSatisfaction: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
teamSchema.index({ name: 1 });
teamSchema.index({ isActive: 1 });
teamSchema.index({ members: 1 });
teamSchema.index({ requestTypes: 1 });

// Virtual for member count
teamSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Virtual for active request types count
teamSchema.virtual('activeRequestTypesCount').get(function() {
  return this.requestTypes.length;
});

export const Team = models.Team || model<ITeam>('Team', teamSchema);