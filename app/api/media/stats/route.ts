//app/api/media/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { Media } from '@/lib/schemas/media.schema';

export const dynamic = 'force-dynamic';

/**
 * GET /api/media/stats
 * Get media storage statistics
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Media stats request received');

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can view global stats
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get overall statistics
    const overallStats = await Media.aggregate([
      {
        $group: {
          _id: null,
          totalFiles: { $sum: 1 },
          totalSize: { $sum: '$size' },
          avgSize: { $avg: '$size' },
          maxSize: { $max: '$size' },
          minSize: { $min: '$size' },
          totalDownloads: { $sum: '$downloadCount' }
        }
      }
    ]);

    // Get statistics by file type
    const typeStats = await Media.aggregate([
      {
        $addFields: {
          category: {
            $switch: {
              branches: [
                { case: { $regexMatch: { input: '$mimeType', regex: '^image/' } }, then: 'image' },
                { case: { $regexMatch: { input: '$mimeType', regex: '^video/' } }, then: 'video' },
                { case: { $regexMatch: { input: '$mimeType', regex: '^audio/' } }, then: 'audio' },
                { case: { $eq: ['$mimeType', 'application/pdf'] }, then: 'pdf' },
                { case: { $regexMatch: { input: '$mimeType', regex: 'document|word' } }, then: 'document' },
                { case: { $regexMatch: { input: '$mimeType', regex: 'spreadsheet|excel' } }, then: 'spreadsheet' },
                { case: { $regexMatch: { input: '$mimeType', regex: '^text/' } }, then: 'text' }
              ],
              default: 'other'
            }
          }
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalSize: { $sum: '$size' },
          avgSize: { $avg: '$size' },
          totalDownloads: { $sum: '$downloadCount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get statistics by association type
    const associationStats = await Media.aggregate([
      {
        $group: {
          _id: '$associatedWith.type',
          count: { $sum: 1 },
          totalSize: { $sum: '$size' },
          avgSize: { $avg: '$size' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get upload trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const uploadTrends = await Media.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 },
          totalSize: { $sum: '$size' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get top uploaders
    const topUploaders = await Media.aggregate([
      {
        $group: {
          _id: '$uploadedBy',
          count: { $sum: 1 },
          totalSize: { $sum: '$size' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          count: 1,
          totalSize: 1,
          user: {
            id: '$user._id',
            name: '$user.name',
            email: '$user.email'
          }
        }
      }
    ]);

    // Get processing status distribution
    const processingStats = await Media.aggregate([
      {
        $group: {
          _id: '$processingStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get virus scan status distribution
    const virusScanStats = await Media.aggregate([
      {
        $group: {
          _id: '$virusScanStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('Media statistics retrieved successfully');

    return NextResponse.json({
      success: true,
      stats: {
        overall: overallStats[0] || {
          totalFiles: 0,
          totalSize: 0,
          avgSize: 0,
          maxSize: 0,
          minSize: 0,
          totalDownloads: 0
        },
        byType: typeStats,
        byAssociation: associationStats,
        uploadTrends,
        topUploaders,
        processingStatus: processingStats,
        virusScanStatus: virusScanStats
      }
    });

  } catch (error) {
    console.error('Media stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}