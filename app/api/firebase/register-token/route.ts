//app/api/firebase/register-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { FirebaseNotificationService } from '@/lib/services/firebaseNotificationService';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const registerTokenSchema = z.object({
  token: z.string().min(1, 'FCM token is required'),
  deviceInfo: z.object({
    platform: z.string().optional(),
    browser: z.string().optional(),
    version: z.string().optional(),
    userAgent: z.string().optional()
  }).optional()
});

/**
 * POST /api/firebase/register-token
 * Register FCM token for user
 */
export async function POST(request: NextRequest) {
  try {
    console.log('FCM token registration request received');

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = registerTokenSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: validation.error.errors 
        },
        { status: 422 }
      );
    }

    const { token, deviceInfo } = validation.data;

    // Register FCM token
    const fcmToken = await FirebaseNotificationService.registerToken(
      session.id,
      token,
      deviceInfo
    );

    console.log(`FCM token registered for user ${session.email}`);

    return NextResponse.json({
      success: true,
      token: {
        id: fcmToken._id,
        isActive: fcmToken.isActive,
        createdAt: fcmToken.createdAt
      }
    });

  } catch (error) {
    console.error('FCM token registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}