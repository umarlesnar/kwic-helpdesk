//lib/schemas/requestType.schema.ts
import { Schema, model, models, Document } from "mongoose";

export interface IRequestType extends Document {
  _id: string;
  name: string;
  description?: string;
  category: string;
  priority: "low" | "medium" | "high" | "critical";
  sla: {
    responseTime: number; // hours
    resolutionTime: number; // hours
    businessHoursOnly: boolean;
  };
  teamId?: Schema.Types.ObjectId;
  isActive: boolean;
  workflow: {
    allowedStatuses: string[];
    defaultStatus: string;
    autoAssignment: boolean;
    requireApproval: boolean;
    approvers: Schema.Types.ObjectId[];
  };
  customFields: {
    name: string;
    type: "text" | "number" | "select" | "multiselect" | "date" | "boolean";
    required: boolean;
    options?: string[];
    defaultValue?: any;
  }[];
  templates: {
    customerNotification?: string;
    agentNotification?: string;
    resolutionTemplate?: string;
  };
  metrics: {
    totalTickets: number;
    avgResolutionTime: number;
    customerSatisfaction: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const requestTypeSchema = new Schema<IRequestType>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },
    sla: {
      responseTime: {
        type: Number,
        required: true,
        default: 24,
      },
      resolutionTime: {
        type: Number,
        required: true,
        default: 72,
      },
      businessHoursOnly: {
        type: Boolean,
        default: true,
      },
    },
    teamId: {
      type: Schema.Types.ObjectId,
      ref: "Team",
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    workflow: {
      allowedStatuses: [
        {
          type: String,
          enum: [
            "open",
            "in_progress",
            "waiting_for_customer",
            "waiting_for_support",
            "pending",
            "reopened",
            "resolved",
            "closed",
            "cancelled",
            "escalated",
          ],
        },
      ],
      defaultStatus: {
        type: String,
        default: "open",
      },
      autoAssignment: {
        type: Boolean,
        default: true,
      },
      requireApproval: {
        type: Boolean,
        default: false,
      },
      approvers: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },
    customFields: [
      {
        name: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ["text", "number", "select", "multiselect", "date", "boolean"],
          required: true,
        },
        required: {
          type: Boolean,
          default: false,
        },
        options: [String],
        defaultValue: Schema.Types.Mixed,
      },
    ],
    templates: {
      customerNotification: String,
      agentNotification: String,
      resolutionTemplate: String,
    },
    metrics: {
      totalTickets: { type: Number, default: 0 },
      avgResolutionTime: { type: Number, default: 0 },
      customerSatisfaction: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for efficient queries
requestTypeSchema.index({ category: 1, priority: 1, isActive: 1 });

export const RequestType =
  models.RequestType ||
  model<IRequestType>("RequestType", requestTypeSchema, "request_types");
