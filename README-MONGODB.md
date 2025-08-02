# MongoDB Schemas Documentation

This document outlines the comprehensive MongoDB schemas created for the Helpdesk Support System.

## Overview

The system uses MongoDB with Mongoose ODM for data persistence. All schemas are designed with production-ready features including:

- Proper indexing for performance
- Data validation and constraints
- Virtual fields for computed properties
- Middleware for business logic
- Comprehensive field definitions

## Schemas

### 1. User Schema (`user.schema.ts`)

**Purpose**: Manages all user accounts (customers, agents, admins)

**Key Features**:
- Role-based access control
- User preferences and settings
- Profile information with address
- Password hashing middleware (ready for production)
- Email verification tracking
- Last login tracking

**Indexes**:
- Email + isActive (unique login)
- Role + isActive (role-based queries)
- Team + Role (team member queries)
- Created date (chronological sorting)

### 2. Team Schema (`team.schema.ts`)

**Purpose**: Organizes support agents into teams

**Key Features**:
- Team member management
- Working hours configuration
- Escalation rules per team
- Auto-assignment settings
- Performance metrics tracking

**Indexes**:
- Team name (unique)
- Active status
- Members array
- Request types array

### 3. Request Type Schema (`requestType.schema.ts`)

**Purpose**: Defines categories and types of support requests

**Key Features**:
- Category-based organization
- SLA configuration (response/resolution times)
- Custom workflow definitions
- Custom fields for specific request types
- Email templates
- Performance metrics

**Indexes**:
- Name + Category (efficient lookups)
- Category + Active status
- Priority + Active status
- Team assignment

### 4. Ticket Schema (`ticket.schema.ts`)

**Purpose**: Core support ticket management

**Key Features**:
- Auto-generated ticket numbers
- Comprehensive status tracking
- SLA monitoring and breach detection
- File attachments support
- Custom fields for flexibility
- Approval workflow
- Customer satisfaction tracking
- Performance metrics

**Indexes**:
- Customer + Status (customer portal)
- Assignee + Status (agent dashboard)
- Team + Status (team management)
- Priority + Status (urgent tickets)
- Due dates (SLA monitoring)
- Full-text search on title/description

### 5. Ticket Activity Schema (`ticketActivity.schema.ts`)

**Purpose**: Tracks all ticket interactions and changes

**Key Features**:
- Comment system with mentions
- Change tracking (status, priority, etc.)
- File attachments
- Internal vs external activities
- Edit history
- Reaction system
- Rich metadata storage

**Indexes**:
- Ticket + Creation date (activity timeline)
- User + Creation date (user activity)
- Type + Creation date (activity filtering)
- Internal flag (customer visibility)

### 6. Notification Schema (`notification.schema.ts`)

**Purpose**: Multi-channel notification system

**Key Features**:
- Email, browser, and SMS channels
- Read/unread tracking
- Priority levels
- Expiration dates
- Rich data payload
- Delivery status tracking

**Indexes**:
- User + Read status + Date (notification center)
- Type + Date (notification filtering)
- Priority + Date (urgent notifications)
- Expiration (automatic cleanup)

### 7. System Settings Schema (`systemSettings.schema.ts`)

**Purpose**: Global system configuration

**Key Features**:
- Company branding
- Email configuration
- Security policies
- Working hours
- Integration settings
- Automation rules
- Analytics configuration

**Constraints**:
- Singleton pattern (only one settings document)
- Comprehensive validation
- Default values for all settings

### 8. Audit Log Schema (`auditLog.schema.ts`)

**Purpose**: Security and compliance tracking

**Key Features**:
- All user actions logging
- IP address and user agent tracking
- Success/failure tracking
- Categorized by security level
- Automatic retention (TTL)
- Rich metadata storage

**Indexes**:
- User + Date (user activity audit)
- Action + Date (action-specific audits)
- Resource + Resource ID (resource audits)
- Category + Severity (security monitoring)

## Database Connection

### Connection Management (`mongodb.ts`)

**Features**:
- Singleton connection pattern
- Connection pooling
- Automatic reconnection
- Connection state monitoring
- Transaction support
- Pagination utilities
- Search query builders

### Usage Examples

```typescript
// Connect to database
import { mongoDb } from '@/lib/mongodb';
await mongoDb.connect();

// Use with transactions
import { withTransaction } from '@/lib/mongodb';
const result = await withTransaction(async (session) => {
  // Your transactional operations here
  return await SomeModel.create([data], { session });
});

// Paginated queries
import { paginate } from '@/lib/mongodb';
const result = await paginate(Ticket, { status: 'open' }, {
  page: 1,
  limit: 20,
  sort: { createdAt: -1 }
});
```

## Production Considerations

### Performance
- All schemas include appropriate indexes
- Compound indexes for common query patterns
- Text indexes for search functionality
- TTL indexes for automatic cleanup

### Security
- Password hashing middleware ready
- Audit logging for all operations
- IP address and session tracking
- Role-based access control

### Scalability
- Connection pooling configured
- Efficient query patterns
- Pagination support
- Aggregation pipeline utilities

### Data Integrity
- Comprehensive validation rules
- Foreign key relationships
- Transaction support for critical operations
- Audit trail for all changes

## Migration Strategy

When ready to switch from mock data to MongoDB:

1. Set up MongoDB connection string in environment variables
2. Run database initialization to create default settings
3. Update the Database class in `lib/database.ts` to use MongoDB models
4. Implement data migration scripts if needed
5. Update API routes to handle MongoDB ObjectIds
6. Test thoroughly with real data

## Environment Variables Required

```env
MONGODB_URI=mongodb://localhost:27017/helpdesk
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/helpdesk
```

## Notes

- All schemas are production-ready with proper validation and indexing
- The current mock data system remains unchanged until migration
- Schemas support all current application features plus additional enterprise features
- Designed for horizontal scaling and high availability
- Includes comprehensive audit trails for compliance requirements