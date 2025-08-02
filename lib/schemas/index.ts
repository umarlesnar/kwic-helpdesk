//lib/schemas/index.ts
// Export all schemas for easy importing
export { User, type IUser } from "./user.schema";
export { Team, type ITeam } from "./team.schema";
export { RequestType, type IRequestType } from "./requestType.schema";
export { Ticket, type ITicket } from "./ticket.schema";
export { TicketActivity, type ITicketActivity } from "./ticketActivity.schema";
export { Notification, type INotification } from "./notification.schema";
export { SystemSettings, type ISystemSettings } from "./systemSettings.schema";
export { AuditLog, type IAuditLog } from "./auditLog.schema";

// Database connection utility
import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/helpdesk";

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("Connected to MongoDB");
      return mongoose;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

import { SystemSettings } from "./systemSettings.schema";

// Utility function to initialize default data
export async function initializeDefaultData() {
  try {
    await connectToDatabase();

    // Check if system settings exist, if not create default
    const existingSettings = await SystemSettings.findOne();
    if (!existingSettings) {
      await SystemSettings.create({});
      console.log("Default system settings created");
    }
    // check if admin user exists, if not create a default admin
    const { User } = await import("./user.schema");
    const adminUserCount = await User.countDocuments({ role: "admin" });
    if (adminUserCount === 0) {
      await User.create({
        auth_type: "local", // Default to local auth
        name: "admin",
        role: "admin",
        email: "admin@helpdesk.com",
        password: "8PN]]Xec?>Ke>[}b" , 
        isActive: true,
      });
    } else {
      throw new Error("Initialization failed");
    }

    
    // Check if at least one request type exists, if not create defaults
    const requestTypeCount = await (
      await import("./requestType.schema")
    ).RequestType.countDocuments({ isActive: true });
    if (requestTypeCount === 0) {
      const { RequestType } = await import("./requestType.schema");
      const now = new Date();
      const defaultRequestTypes = [
        {
          name: "Bug Report",
          description: "Report software bugs and issues",
          category: "Technical",
          priority: "high",
          sla: { responseTime: 24, resolutionTime: 24, businessHoursOnly: false },
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: "Feature Request",
          description: "Request new features or enhancements",
          category: "Product",
          priority: "medium",
          sla: { responseTime: 72, resolutionTime: 72, businessHoursOnly: false },
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: "Account Support",
          description: "Help with account-related issues",
          category: "Account",
          priority: "medium",
          sla: { responseTime: 48, resolutionTime: 48, businessHoursOnly: false },
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: "Billing Inquiry",
          description: "Questions about billing and payments",
          category: "Billing",
          priority: "high",
          sla: { responseTime: 12, resolutionTime: 12, businessHoursOnly: false },
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          name: "Training Request",
          description: "Request for training and onboarding",
          category: "Training",
          priority: "low",
          sla: { responseTime: 96, resolutionTime: 96, businessHoursOnly: false },
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      ];
      await RequestType.create(defaultRequestTypes);
      console.log("Default request types created");
    }

    console.log("Database initialization completed");
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}
