//lib/schemas/systemSettings.schema.ts
import { Schema, model, models, Document } from 'mongoose';

export interface ISystemSettings extends Document {
  _id: string;
  general: {
    companyName: string;
    supportEmail: string;
    timezone: string;
    language: string;
    welcomeMessage: string;
    maintenanceMode: boolean;
    maintenanceMessage?: string;
  };
  email: {
    enabled: boolean;
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      username: string;
      password: string;
    };
    templates: {
      ticketCreated: string;
      ticketUpdated: string;
      ticketResolved: string;
      commentAdded: string;
    };
  };
  notifications: {
    ticketCreated: boolean;
    ticketAssigned: boolean;
    customerReply: boolean;
    slaBreachWarning: boolean;
    escalationAlert: boolean;
  };
  security: {
    requireTwoFactor: boolean;
    sessionTimeout: number; // minutes
    passwordPolicy: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
    };
    allowedDomains: string[];
    ipWhitelist: string[];
  };
  appearance: {
    primaryColor: string;
    logoUrl?: string;
    faviconUrl?: string;
    customCss?: string;
    darkModeEnabled: boolean;
  };
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
    holidays: {
      name: string;
      date: Date;
      recurring: boolean;
    }[];
  };
  integrations: {
    slack: {
      enabled: boolean;
      webhookUrl?: string;
      channels: {
        general?: string;
        alerts?: string;
        escalations?: string;
      };
    };
    teams: {
      enabled: boolean;
      webhookUrl?: string;
    };
    zapier: {
      enabled: boolean;
      apiKey?: string;
    };
  };
  automation: {
    autoAssignment: {
      enabled: boolean;
      strategy: 'round_robin' | 'least_loaded' | 'skill_based';
    };
    escalationRules: {
      priority: 'low' | 'medium' | 'high' | 'critical';
      hoursBeforeEscalation: number;
      escalateTo: 'team_lead' | 'manager' | 'admin';
      notificationChannels: string[];
    }[];
    autoClose: {
      enabled: boolean;
      daysAfterResolution: number;
    };
  };
  analytics: {
    retentionDays: number;
    enableTracking: boolean;
    customMetrics: {
      name: string;
      query: string;
      enabled: boolean;
    }[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const systemSettingsSchema = new Schema<ISystemSettings>({
  general: {
    companyName: { type: String, default: 'Helpdesk Support System' },
    supportEmail: { type: String, default: 'support@helpdesk.com' },
    timezone: { type: String, default: 'UTC' },
    language: { type: String, default: 'en' },
    welcomeMessage: { type: String, default: 'Welcome to our help center. We\'re here to assist you.' },
    maintenanceMode: { type: Boolean, default: false },
    maintenanceMessage: String
  },
  email: {
    enabled: { type: Boolean, default: true },
    smtp: {
      host: String,
      port: { type: Number, default: 587 },
      secure: { type: Boolean, default: false },
      username: String,
      password: String
    },
    templates: {
      ticketCreated: { type: String, default: 'Your ticket has been created.' },
      ticketUpdated: { type: String, default: 'Your ticket has been updated.' },
      ticketResolved: { type: String, default: 'Your ticket has been resolved.' },
      commentAdded: { type: String, default: 'A new comment has been added to your ticket.' }
    }
  },
  notifications: {
    ticketCreated: { type: Boolean, default: true },
    ticketAssigned: { type: Boolean, default: true },
    customerReply: { type: Boolean, default: true },
    slaBreachWarning: { type: Boolean, default: true },
    escalationAlert: { type: Boolean, default: true }
  },
  security: {
    requireTwoFactor: { type: Boolean, default: false },
    sessionTimeout: { type: Number, default: 60 },
    passwordPolicy: {
      minLength: { type: Number, default: 8 },
      requireUppercase: { type: Boolean, default: true },
      requireLowercase: { type: Boolean, default: true },
      requireNumbers: { type: Boolean, default: true },
      requireSpecialChars: { type: Boolean, default: false }
    },
    allowedDomains: [String],
    ipWhitelist: [String]
  },
  appearance: {
    primaryColor: { type: String, default: '#3B82F6' },
    logoUrl: String,
    faviconUrl: String,
    customCss: String,
    darkModeEnabled: { type: Boolean, default: true }
  },
  workingHours: {
    timezone: { type: String, default: 'UTC' },
    schedule: {
      monday: { enabled: { type: Boolean, default: true }, start: { type: String, default: '09:00' }, end: { type: String, default: '17:00' } },
      tuesday: { enabled: { type: Boolean, default: true }, start: { type: String, default: '09:00' }, end: { type: String, default: '17:00' } },
      wednesday: { enabled: { type: Boolean, default: true }, start: { type: String, default: '09:00' }, end: { type: String, default: '17:00' } },
      thursday: { enabled: { type: Boolean, default: true }, start: { type: String, default: '09:00' }, end: { type: String, default: '17:00' } },
      friday: { enabled: { type: Boolean, default: true }, start: { type: String, default: '09:00' }, end: { type: String, default: '17:00' } },
      saturday: { enabled: { type: Boolean, default: false }, start: { type: String, default: '09:00' }, end: { type: String, default: '17:00' } },
      sunday: { enabled: { type: Boolean, default: false }, start: { type: String, default: '09:00' }, end: { type: String, default: '17:00' } }
    },
    holidays: [{
      name: { type: String, required: true },
      date: { type: Date, required: true },
      recurring: { type: Boolean, default: false }
    }]
  },
  integrations: {
    slack: {
      enabled: { type: Boolean, default: false },
      webhookUrl: String,
      channels: {
        general: String,
        alerts: String,
        escalations: String
      }
    },
    teams: {
      enabled: { type: Boolean, default: false },
      webhookUrl: String
    },
    zapier: {
      enabled: { type: Boolean, default: false },
      apiKey: String
    }
  },
  automation: {
    autoAssignment: {
      enabled: { type: Boolean, default: true },
      strategy: { type: String, enum: ['round_robin', 'least_loaded', 'skill_based'], default: 'round_robin' }
    },
    escalationRules: [{
      priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
      hoursBeforeEscalation: { type: Number, required: true },
      escalateTo: { type: String, enum: ['team_lead', 'manager', 'admin'], required: true },
      notificationChannels: [String]
    }],
    autoClose: {
      enabled: { type: Boolean, default: true },
      daysAfterResolution: { type: Number, default: 7 }
    }
  },
  analytics: {
    retentionDays: { type: Number, default: 365 },
    enableTracking: { type: Boolean, default: true },
    customMetrics: [{
      name: { type: String, required: true },
      query: { type: String, required: true },
      enabled: { type: Boolean, default: true }
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Ensure only one settings document exists
systemSettingsSchema.index({}, { unique: true });

export const SystemSettings = models.SystemSettings || model<ISystemSettings>('SystemSettings', systemSettingsSchema, 'system_settings');