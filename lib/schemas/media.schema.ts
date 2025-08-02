//lib/schemas/media.schema.ts
import { Schema, model, models, Document } from 'mongoose';

export interface IMedia extends Document {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  s3Key: string;
  s3Bucket: string;
  s3Region: string;
  url: string;
  thumbnailUrl?: string;
  metadata: {
    width?: number;
    height?: number;
    duration?: number; // for videos
    pages?: number; // for documents
    encoding?: string;
    [key: string]: any;
  };
  uploadedBy: Schema.Types.ObjectId;
  associatedWith: {
    type: 'ticket' | 'user' | 'comment' | 'system';
    id: Schema.Types.ObjectId;
  };
  tags: string[];
  isPublic: boolean;
  isProcessed: boolean;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  processingError?: string;
  virusScanStatus: 'pending' | 'clean' | 'infected' | 'failed';
  virusScanResult?: string;
  downloadCount: number;
  lastAccessedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const mediaSchema = new Schema<IMedia>({
  filename: {
    type: String,
    required: true,
    trim: true
  },
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  mimeType: {
    type: String,
    required: true,
    index: true
  },
  size: {
    type: Number,
    required: true,
    min: 0
  },
  s3Key: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  s3Bucket: {
    type: String,
    required: true
  },
  s3Region: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  thumbnailUrl: String,
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  associatedWith: {
    type: {
      type: String,
      enum: ['ticket', 'user', 'comment', 'system'],
      required: true
    },
    id: {
      type: Schema.Types.ObjectId,
      required: true
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: true,
    index: true
  },
  isProcessed: {
    type: Boolean,
    default: false,
    index: true
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
    index: true
  },
  processingError: String,
  virusScanStatus: {
    type: String,
    enum: ['pending', 'clean', 'infected', 'failed'],
    default: 'pending',
    index: true
  },
  virusScanResult: String,
  downloadCount: {
    type: Number,
    default: 0
  },
  lastAccessedAt: Date,
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
mediaSchema.index({ uploadedBy: 1, createdAt: -1 });
mediaSchema.index({ 'associatedWith.type': 1, 'associatedWith.id': 1 });
mediaSchema.index({ mimeType: 1, isPublic: 1 });
// Removed mediaSchema.index({ tags: 1 });
mediaSchema.index({ createdAt: -1 });
mediaSchema.index({ size: 1 });
mediaSchema.index({ downloadCount: -1 });

// Compound indexes for common queries
mediaSchema.index({ uploadedBy: 1, 'associatedWith.type': 1, createdAt: -1 });
mediaSchema.index({ mimeType: 1, processingStatus: 1 });
mediaSchema.index({ virusScanStatus: 1, createdAt: 1 });

// Virtual for file extension
mediaSchema.virtual('extension').get(function() {
  return this.originalName.split('.').pop()?.toLowerCase() || '';
});

// Virtual for file type category
mediaSchema.virtual('category').get(function() {
  if (this.mimeType.startsWith('image/')) return 'image';
  if (this.mimeType.startsWith('video/')) return 'video';
  if (this.mimeType.startsWith('audio/')) return 'audio';
  if (this.mimeType.includes('pdf')) return 'pdf';
  if (this.mimeType.includes('document') || this.mimeType.includes('word')) return 'document';
  if (this.mimeType.includes('spreadsheet') || this.mimeType.includes('excel')) return 'spreadsheet';
  if (this.mimeType.includes('presentation') || this.mimeType.includes('powerpoint')) return 'presentation';
  if (this.mimeType.includes('text/')) return 'text';
  if (this.mimeType.includes('zip') || this.mimeType.includes('archive')) return 'archive';
  return 'other';
});

// Virtual for human readable file size
mediaSchema.virtual('humanSize').get(function() {
  const bytes = this.size;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Static method to find by S3 key
mediaSchema.statics.findByS3Key = function(s3Key: string) {
  return this.findOne({ s3Key });
};

// Static method to find by association
mediaSchema.statics.findByAssociation = function(type: string, id: string) {
  return this.find({ 'associatedWith.type': type, 'associatedWith.id': id });
};

// Static method to get storage statistics
mediaSchema.statics.getStorageStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalFiles: { $sum: 1 },
        totalSize: { $sum: '$size' },
        avgSize: { $avg: '$size' },
        maxSize: { $max: '$size' },
        minSize: { $min: '$size' }
      }
    }
  ]);

  const typeStats = await this.aggregate([
    {
      $group: {
        _id: '$mimeType',
        count: { $sum: 1 },
        totalSize: { $sum: '$size' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  return {
    overall: stats[0] || { totalFiles: 0, totalSize: 0, avgSize: 0, maxSize: 0, minSize: 0 },
    byType: typeStats
  };
};

export const Media = models.Media || model<IMedia>('Media', mediaSchema);