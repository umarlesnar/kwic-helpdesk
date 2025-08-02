//app/api/media/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getS3Service } from '@/lib/services/s3Service';
import { Media } from '@/lib/schemas/media.schema';

export const dynamic = 'force-dynamic';

/**
 * GET /api/media/[id]
 * Get media details and download URL
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Media details request received for ID:', params.id);

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const media = await Media.findById(params.id)
      .populate('uploadedBy', 'name email');

    if (!media) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    const hasAccess = 
      media.isPublic ||
      media.uploadedBy._id.toString() === session.id ||
      session.role === 'admin' ||
      (session.role === 'agent' && media.associatedWith.type === 'ticket');

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Generate download URL if requested
    const url = new URL(request.url);
    const generateDownloadUrl = url.searchParams.get('download') === 'true';
    
    let downloadUrl: string | undefined;
    if (generateDownloadUrl) {
      const s3Service = getS3Service();
      downloadUrl = await s3Service.generateDownloadUrl(media.s3Key);
    }

    console.log(`Media details retrieved for ${params.id}`);

    return NextResponse.json({
      success: true,
      media: {
        id: media._id,
        filename: media.filename,
        originalName: media.originalName,
        mimeType: media.mimeType,
        size: media.size,
        url: media.url,
        downloadUrl,
        thumbnailUrl: media.thumbnailUrl,
        category: media.category,
        humanSize: media.humanSize,
        tags: media.tags,
        isPublic: media.isPublic,
        isProcessed: media.isProcessed,
        processingStatus: media.processingStatus,
        virusScanStatus: media.virusScanStatus,
        downloadCount: media.downloadCount,
        lastAccessedAt: media.lastAccessedAt,
        associatedWith: media.associatedWith,
        uploadedBy: {
          id: media.uploadedBy._id,
          name: media.uploadedBy.name,
          email: media.uploadedBy.email
        },
        metadata: media.metadata,
        createdAt: media.createdAt,
        updatedAt: media.updatedAt
      }
    });

  } catch (error) {
    console.error('Media details error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/media/[id]
 * Delete media file
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Media deletion request received for ID:', params.id);

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const media = await Media.findById(params.id);
    if (!media) {
      return NextResponse.json(
        { error: 'Media not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const canDelete = 
      media.uploadedBy.toString() === session.id ||
      session.role === 'admin';

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const s3Service = getS3Service();
    const deleted = await s3Service.deleteFile(params.id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete media' },
        { status: 500 }
      );
    }

    console.log(`Media deleted successfully: ${params.id}`);

    return NextResponse.json({
      success: true,
      message: 'Media deleted successfully'
    });

  } catch (error) {
    console.error('Media deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}