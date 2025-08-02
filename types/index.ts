//types/index.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'agent' | 'admin';
  teamId?: string;
  avatar?: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  members: string[]; // User IDs
  requestTypes: string[]; // Request Type IDs
  createdAt: Date;
}

export interface RequestType {
  _id: string;
  id: string;
  name: string;
  description?: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  sla: number; // hours
  teamId?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  requestTypeId: string;
  customerId: string;
  assigneeId?: string;
  status: TicketStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  labels: string[];
  teamId?: string;
  dueDate?: Date;
  estimatedHours?: number;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  participants: string[];
  approvers: string[];
}

export type TicketStatus = 
  | 'open'
  | 'in_progress'
  | 'waiting_for_customer'
  | 'waiting_for_support'
  | 'pending'
  | 'reopened'
  | 'resolved'
  | 'closed'
  | 'cancelled'
  | 'escalated';

export interface TicketActivity {
  id: string;
  ticketId: string;
  userId: string;
  type: 'comment' | 'status_change' | 'assignment' | 'priority_change' | 'label_change';
  content?: string;
  isInternal: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface Comment {
  id: string;
  ticketId: string;
  userId: string;
  content: string;
  isInternal: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'ticket_created' | 'ticket_updated' | 'ticket_resolved' | 'comment_added';
  isActive: boolean;
}

export interface SystemSettings {
  emailNotifications: boolean;
  autoAssignment: boolean;
  escalationRules: EscalationRule[];
  workingHours: WorkingHours;
  branding: {
    companyName: string;
    logo?: string;
    primaryColor: string;
  };
}

export interface EscalationRule {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  hours: number;
  escalateTo: string; // Team ID or User ID
}

export interface WorkingHours {
  timezone: string;
  days: {
    monday: { start: string; end: string; enabled: boolean };
    tuesday: { start: string; end: string; enabled: boolean };
    wednesday: { start: string; end: string; enabled: boolean };
    thursday: { start: string; end: string; enabled: boolean };
    friday: { start: string; end: string; enabled: boolean };
    saturday: { start: string; end: string; enabled: boolean };
    sunday: { start: string; end: string; enabled: boolean };
  };
}

export interface DashboardMetrics {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  avgResolutionTime: number;
  ticketsByStatus: Record<TicketStatus, number>;
  ticketsByPriority: Record<string, number>;
  recentActivity: TicketActivity[];
  dueSoonTickets: Ticket[];
}