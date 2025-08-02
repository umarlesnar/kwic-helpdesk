//app/api/media/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getS3Service, S3Service } from '@/lib/services/s3Service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const uploadRequestSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  contentType: z.string().min(1, 'Content type is required'),
  size: z.number().min(1, 'File size must be greater than 0'),
  associatedWith: z.object({
    type: z.enum(['ticket', 'user', 'comment', 'activity', 'system']),
    id: z.string().min(1, 'Associated ID is required')
  }),
  // Removed tags from schema
  expiresIn: z.number().min(300).max(86400).default(3600), // 5 minutes to 24 hours
});

/**
 * POST /api/media/upload
 * Generate presigned URL for file upload
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Media upload request received');

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = uploadRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: validation.error.errors 
        },
        { status: 422 }
      );
    }

    const { filename, contentType, size, associatedWith, expiresIn } = validation.data; // Removed tags

    // Validate file
    const fileValidation = S3Service.validateFile(filename, contentType, size);
    if (!fileValidation.valid) {
      return NextResponse.json(
        { error: fileValidation.error },
        { status: 400 }
      );
    }

    // Check permissions for association
    if (associatedWith.type === 'ticket') {
      // TODO: Verify user has access to the ticket
    } else if (associatedWith.type === 'user' && associatedWith.id !== session.id) {
      // Users can only upload files for themselves unless they're admin/agent
      if (session.role === 'customer') {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    const s3Service = getS3Service();

    // Generate upload URL (no DB record)
    const uploadData = await s3Service.generateUploadUrl(
      filename,
      contentType,
      {
        uploadedBy: session.id,
        associatedWith,
        // Removed tags from S3 metadata
        isPublic: true // Always set to true
      },
      {
        expiresIn,
        contentType,
        contentLength: size
      }
    );

    console.log(`Generated upload URL for ${filename}, s3Key: ${uploadData.s3Key}`);

    return NextResponse.json({
      success: true,
      uploadUrl: uploadData.uploadUrl,
      s3Key: uploadData.s3Key,
      expiresAt: uploadData.expiresAt,
      instructions: {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
          'Content-Length': size.toString()
        },
        note: 'Upload the file directly to the uploadUrl using PUT method'
      }
    });

  } catch (error) {
    console.error('Media upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}