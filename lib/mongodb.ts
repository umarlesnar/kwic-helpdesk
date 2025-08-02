//lib/mongodb.ts
// MongoDB connection and utilities
import mongoose from 'mongoose';
import { connectToDatabase, initializeDefaultData } from './schemas';

// Re-export for convenience
export { connectToDatabase, initializeDefaultData };

// Database utilities
export class MongoDatabase {
  private static instance: MongoDatabase;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): MongoDatabase {
    if (!MongoDatabase.instance) {
      MongoDatabase.instance = new MongoDatabase();
    }
    return MongoDatabase.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await connectToDatabase();
      this.isConnected = true;
      console.log('MongoDB connected successfully');
    } catch (error) {
      console.error('MongoDB connection failed:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('MongoDB disconnected successfully');
    } catch (error) {
      console.error('MongoDB disconnection failed:', error);
      throw error;
    }
  }

  public isConnectionActive(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public getConnectionState(): string {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    return states[mongoose.connection.readyState as keyof typeof states] || 'unknown';
  }
}

// Export singleton instance
export const mongoDb = MongoDatabase.getInstance();

// Helper function for transaction handling
export async function withTransaction<T>(
  operation: (session: mongoose.ClientSession) => Promise<T>
): Promise<T> {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    const result = await operation(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}

// Helper function for aggregation pipelines
export function createAggregationPipeline(stages: any[]): any[] {
  return stages.filter(stage => stage !== null && stage !== undefined);
}

// Helper function for building search queries
export function buildSearchQuery(searchTerm: string, fields: string[]): any {
  if (!searchTerm || !fields.length) {
    return {};
  }

  return {
    $or: fields.map(field => ({
      [field]: { $regex: searchTerm, $options: 'i' }
    }))
  };
}

// Helper function for pagination
export interface PaginationOptions {
  page: number;
  limit: number;
  sort?: any;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export async function paginate<T>(
  model: mongoose.Model<T>,
  query: any = {},
  options: PaginationOptions
): Promise<PaginatedResult<T>> {
  const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model.find(query).sort(sort).skip(skip).limit(limit).exec(),
    model.countDocuments(query).exec()
  ]);

  const pages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages,
      hasNext: page < pages,
      hasPrev: page > 1
    }
  };
}