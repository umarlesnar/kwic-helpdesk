// lib/services/s3Service.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import sharp from 'sharp';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import { Media, IMedia } from '@/lib/schemas/media.schema';

export interface S3Config {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string; // For S3-compatible services
}

export interface PresignedUrlOptions {
  expiresIn?: number; // seconds, default 3600 (1 hour)
  contentType?: string;
  contentLength?: number;
  metadata?: Record<string, string>;
}

export interface UploadMetadata {
  uploadedBy: string;
  associatedWith: {
    type: 'ticket' | 'user' | 'comment' | 'system';
    id: string;
  };
  tags?: string[];
  isPublic?: boolean;
  expiresAt?: Date;
}

export class S3Service {
  private s3Client: S3Client;
  private bucket: string;
  private region: string;

  constructor(config: S3Config) {
    this.bucket = config.bucket;
    this.region = config.region;
    
    this.s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      endpoint: config.endpoint,
      forcePathStyle: !!config.endpoint, // Required for some S3-compatible services
    });
  }

  /**
   * Generate presigned URL for file upload
   */
  async generateUploadUrl(
    filename: string,
    contentType: string,
    metadata: UploadMetadata,
    options: PresignedUrlOptions = {}
  ): Promise<{
    uploadUrl: string;
    s3Key: string;
    expiresAt: Date;
  }> {
    try {
      // Generate unique S3 key
      const s3Key = this.generateS3Key(filename, metadata);

      // Generate presigned URL (no DB record yet)
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
        ContentType: contentType,
        ContentLength: options.contentLength,
        Metadata: {
          'uploaded-by': metadata.uploadedBy,
          'associated-type': metadata.associatedWith.type,
          'associated-id': metadata.associatedWith.id,
          ...options.metadata
        }
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: options.expiresIn || 3600,
      });

      const expiresAt = new Date(Date.now() + (options.expiresIn || 3600) * 1000);

      console.log(`Generated upload URL for ${filename}, S3 key: ${s3Key}`);

      return {
        uploadUrl,
        s3Key,
        expiresAt
      };
    } catch (error) {
      console.error('Error generating upload URL:', error);
      throw new Error('Failed to generate upload URL');
    }
  }

  /**
   * Generate presigned URL for file download
   */
  async generateDownloadUrl(
    s3Key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
      });

      const downloadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      // Update access tracking
      await Media.findOneAndUpdate(
        { s3Key },
        { 
          $inc: { downloadCount: 1 },
          lastAccessedAt: new Date()
        }
      );

      console.log(`Generated download URL for S3 key: ${s3Key}`);
      return downloadUrl;
    } catch (error) {
      console.error('Error generating download URL:', error);
      throw new Error('Failed to generate download URL');
    }
  }

  /**
   * Confirm file upload and update metadata
   */
  async confirmUpload(
    mediaId: string,
    actualSize?: number,
    additionalMetadata?: Record<string, any>
  ): Promise<IMedia | null> {
    try {
      // mediaId is now the s3Key (not a DB id)
      const s3Key = mediaId;

      // Verify file exists in S3
      const headCommand = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
      });

      const headResult = await this.s3Client.send(headCommand);

      // Create media record in DB
      const media = new Media({
        filename: s3Key.split('/').pop() || s3Key,
        originalName: s3Key.split('/').pop() || s3Key,
        mimeType: headResult.ContentType || 'application/octet-stream',
        size: actualSize || headResult.ContentLength || 0,
        s3Key,
        s3Bucket: this.bucket,
        s3Region: this.region,
        url: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${s3Key}`,
        uploadedBy: additionalMetadata?.uploadedBy,
        associatedWith: additionalMetadata?.associatedWith,
        tags: additionalMetadata?.tags || [],
        isPublic: additionalMetadata?.isPublic || false,
        expiresAt: additionalMetadata?.expiresAt,
        processingStatus: 'completed',
        isProcessed: true,
        virusScanStatus: 'pending',
        metadata: additionalMetadata?.metadata || {},
      });

      // Save first to get the _id
      await media.save();

      // If image, generate thumbnail
      if ((media.mimeType || '').startsWith('image/')) {
        await this.generateThumbnail(media._id.toString());
      }

      console.log(`Confirmed upload for media ${media._id}`);
      return media;
    } catch (error) {
      console.error('Error confirming upload:', error);
      throw new Error('Failed to confirm upload');
    }
  }

  /**
   * Delete file from S3 and database
   */
  async deleteFile(mediaId: string): Promise<boolean> {
    try {
      const media = await Media.findById(mediaId);
      if (!media) {
        throw new Error('Media record not found');
      }

      // Delete from S3
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: media.s3Key,
      });
      await this.s3Client.send(deleteCommand);

      // Delete from database
      await Media.findByIdAndDelete(mediaId);

      console.log(`Deleted file ${media.s3Key} from S3 and database`);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Generate thumbnail for images
   */
  async generateThumbnail(
    mediaId: string,
    width: number = 300,
    height: number = 300
  ): Promise<string | null> {
    try {
      const media = await Media.findById(mediaId);
      if (!media || !media.mimeType?.startsWith('image/')) {
        return null;
      }

      // Download the original image from S3
      const getObjectCommand = new GetObjectCommand({
        Bucket: this.bucket,
        Key: media.s3Key,
      });
      const s3Response = await this.s3Client.send(getObjectCommand);
      // s3Response.Body is a stream
      const imageBuffer = await streamToBuffer(s3Response.Body as Readable);

      // Use sharp to resize
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(width, height, { fit: 'cover' })
        .toFormat('jpeg')
        .toBuffer();


      // Upload the thumbnail to S3 at a predictable key
      const thumbnailKey = `thumbnails/${media.s3Key}.jpg`;
      const putCommand = new PutObjectCommand({
        Bucket: this.bucket,
        Key: thumbnailKey,
        Body: thumbnailBuffer,
        ContentType: 'image/jpeg',
      });
      await this.s3Client.send(putCommand);

      // Construct the public URL for the thumbnail
      const thumbnailUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${thumbnailKey}`;

      // Update media record with thumbnail URL
      await Media.findByIdAndUpdate(mediaId, {
        thumbnailUrl,
        'metadata.thumbnailGenerated': true
      });

      console.log(`Generated thumbnail for media ${mediaId}`);
      return thumbnailUrl;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return null;
    }
  }

  /**
   * List files with pagination
   */
  async listFiles(
    prefix?: string,
    maxKeys: number = 100,
    continuationToken?: string
  ): Promise<{
    files: any[];
    nextContinuationToken?: string;
    isTruncated: boolean;
  }> {
    try {
      // This would use ListObjectsV2Command in a real implementation
      // For now, we'll query the database
      const query: any = {};
      if (prefix) {
        query.s3Key = { $regex: `^${prefix}` };
      }

      const files = await Media.find(query)
        .limit(maxKeys)
        .sort({ createdAt: -1 })
        .populate('uploadedBy', 'name email');

      return {
        files,
        isTruncated: files.length === maxKeys,
      };
    } catch (error) {
      console.error('Error listing files:', error);
      throw new Error('Failed to list files');
    }
  }

  /**
   * Generate unique S3 key for file
   */
  private generateS3Key(filename: string, metadata: UploadMetadata): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const randomId = crypto.randomBytes(8).toString('hex');
    const sanitizedFilename = this.sanitizeFilename(filename);
    const extension = sanitizedFilename.split('.').pop();
    
    return `${metadata.associatedWith.type}/${metadata.associatedWith.id}/${timestamp}/${randomId}.${extension}`;
  }

  /**
   * Sanitize filename for S3
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  }

  /**
   * Validate file type and size
   */
  static validateFile(
    filename: string,
    contentType: string,
    size: number,
    options: {
      maxSize?: number;
      allowedTypes?: string[];
      allowedExtensions?: string[];
    } = {}
  ): { valid: boolean; error?: string } {
    const {
      maxSize = 100 * 1024 * 1024, // 100MB default
      allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/quicktime',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'text/csv'
      ],
      allowedExtensions = [
        'jpg', 'jpeg', 'png', 'gif', 'webp',
        'mp4', 'webm', 'mov',
        'pdf', 'doc', 'docx', 'xls', 'xlsx',
        'txt', 'csv'
      ]
    } = options;

    // Check file size
    if (size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`
      };
    }

    // Check content type
    if (!allowedTypes.includes(contentType)) {
      return {
        valid: false,
        error: `File type ${contentType} is not allowed`
      };
    }

    // Check file extension
    const extension = filename.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `File extension .${extension} is not allowed`
      };
    }

    return { valid: true };
  }
}

// Helper to convert stream to buffer
function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on('data', (chunk) => chunks.push(chunk as Uint8Array));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

// Export singleton instance
let s3ServiceInstance: S3Service | null = null;

export function getS3Service(): S3Service {
  if (!s3ServiceInstance) {
    const config: S3Config = {
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.AWS_S3_BUCKET || 'helpdesk-media',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      endpoint: process.env.AWS_S3_ENDPOINT, // For LocalStack or other S3-compatible services
    };

    if (!config.accessKeyId || !config.secretAccessKey || !config.bucket) {
      throw new Error('AWS S3 configuration is incomplete. Please check environment variables.');
    }

    s3ServiceInstance = new S3Service(config);
  }

  return s3ServiceInstance;
}