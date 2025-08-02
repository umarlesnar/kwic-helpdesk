//app/api/firebase/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { FirebaseNotificationService } from '@/lib/services/firebaseNotificationService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/firebase/stats
 * Get Firebase notification statistics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Firebase notification stats request received');

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can view stats
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get FCM token statistics
    const stats = await FirebaseNotificationService.getTokenStats();

    console.log('Firebase notification stats retrieved successfully');

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Firebase notification stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}