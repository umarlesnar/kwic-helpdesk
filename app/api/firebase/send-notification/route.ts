//app/api/firebase/send-notification/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { FirebaseNotificationService } from '@/lib/services/firebaseNotificationService';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const sendNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  icon: z.string().optional(),
  image: z.string().optional(),
  badge: z.string().optional(),
  tag: z.string().optional(),
  clickAction: z.string().optional(),
  sound: z.string().optional(),
  priority: z.enum(['normal', 'high']).optional(),
  timeToLive: z.number().optional(),
  data: z.record(z.string()).optional(),
  targets: z.object({
    userId: z.string().optional(),
    userIds: z.array(z.string()).optional(),
    roles: z.array(z.enum(['customer', 'agent', 'admin'])).optional(),
    tokens: z.array(z.string()).optional(),
    topic: z.string().optional()
  }).optional()
});

/**
 * POST /api/firebase/send-notification
 * Send Firebase notification (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Send Firebase notification request received');

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can send notifications
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const validation = sendNotificationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: validation.error.errors 
        },
        { status: 422 }
      );
    }

    const { targets, ...payload } = validation.data;

    // Send Firebase notification
    const result = await FirebaseNotificationService.sendNotification(
      payload, 
      targets || {}
    );

    console.log(`Firebase notification sent: ${result.success} successful, ${result.failure} failed`);

    return NextResponse.json({
      success: true,
      result: {
        success: result.success,
        failure: result.failure,
        errors: result.errors
      }
    });

  } catch (error) {
    console.error('Send Firebase notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}