//app/api/media/list/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { Media } from '@/lib/schemas/media.schema';
import { z } from 'zod';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

const listMediaSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  associatedTypes: z.array(z.enum(['ticket', 'user', 'comment', 'activity', 'system'])).optional(),
  associatedId: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'size', 'downloadCount', 'filename']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

/**
 * GET /api/media/list
 * List media files with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Media list request received');

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const queryParams = {
      page: parseInt(url.searchParams.get('page') || '1'),
      limit: parseInt(url.searchParams.get('limit') || '20'),
      associatedTypes: url.searchParams.getAll('associatedTypes'),
      associatedId: url.searchParams.get('associatedId') || undefined,
      category: url.searchParams.get('category') || undefined,
      tags: url.searchParams.getAll('tags'),
      search: url.searchParams.get('search') || undefined,
      sortBy: url.searchParams.get('sortBy') || 'createdAt',
      sortOrder: url.searchParams.get('sortOrder') || 'desc'
    };

    const validation = listMediaSchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters', 
          details: validation.error.errors 
        },
        { status: 422 }
      );
    }

    const { page, limit, associatedTypes, associatedId, category, tags, search, sortBy, sortOrder } = validation.data;

    // Build query
    const query: any = {};

    // Access control
    if (session.role === 'customer') {
      // Customers can only see their own files or public files
      query.$or = [
        { uploadedBy: session.id },
        { isPublic: true }
      ];
    } else if (session.role === 'agent') {
      // Agents can see ticket-related files and their own files
      query.$or = [
        { uploadedBy: session.id },
        { 'associatedWith.type': 'ticket' },
        { isPublic: true }
      ];
    }
    // Admins can see all files (no additional restrictions)

    // Apply filters
    if (associatedId && (associatedTypes ?? []).length > 0) {
      // Convert associatedId to ObjectId if it's a valid ObjectId string
      const objectId = mongoose.Types.ObjectId.isValid(associatedId) 
        ? new mongoose.Types.ObjectId(associatedId) 
        : associatedId;
      query['associatedWith.id'] = objectId;
      query['associatedWith.type'] = { $in: associatedTypes };
      console.log('Media list query with associatedId:', { associatedId, objectId, associatedTypes });
    } else if ((associatedTypes ?? []).length > 0) {
      query['associatedWith.type'] = { $in: associatedTypes };
    }

    if (tags && tags.length > 0) {
      query.tags = { $in: tags };
    }

    if (search) {
      query.$or = [
        { filename: { $regex: search, $options: 'i' } },
        { originalName: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter (virtual field, so we filter by mimeType)
    if (category) {
      switch (category) {
        case 'image':
          query.mimeType = { $regex: '^image/' };
          break;
        case 'video':
          query.mimeType = { $regex: '^video/' };
          break;
        case 'audio':
          query.mimeType = { $regex: '^audio/' };
          break;
        case 'pdf':
          query.mimeType = 'application/pdf';
          break;
        case 'document':
          query.mimeType = { $in: [
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ]};
          break;
        case 'spreadsheet':
          query.mimeType = { $in: [
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          ]};
          break;
        case 'text':
          query.mimeType = { $regex: '^text/' };
          break;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [media, total] = await Promise.all([
      Media.find(query)
        .populate('uploadedBy', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .lean(),
      Media.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    console.log(`Media list retrieved: ${media.length} items, page ${page}/${totalPages}`);

    return NextResponse.json({
      success: true,
      media: media.map(item => ({
        id: item._id,
        filename: item.filename,
        originalName: item.originalName,
        mimeType: item.mimeType,
        size: item.size,
        url: item.url,
        thumbnailUrl: item.thumbnailUrl,
        tags: item.tags,
        isPublic: item.isPublic,
        isProcessed: item.isProcessed,
        processingStatus: item.processingStatus,
        virusScanStatus: item.virusScanStatus,
        downloadCount: item.downloadCount,
        lastAccessedAt: item.lastAccessedAt,
        associatedWith: item.associatedWith,
        uploadedBy: {
          id: item.uploadedBy._id,
          name: item.uploadedBy.name,
          email: item.uploadedBy.email
        },
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Media list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}