//app/api/firebase/unregister-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { FirebaseNotificationService } from '@/lib/services/firebaseNotificationService';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const unregisterTokenSchema = z.object({
  token: z.string().optional()
});

/**
 * POST /api/firebase/unregister-token
 * Unregister FCM token for user
 */
export async function POST(request: NextRequest) {
  try {
    console.log('FCM token unregistration request received');

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = unregisterTokenSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: validation.error.errors 
        },
        { status: 422 }
      );
    }

    const { token } = validation.data;

    // Unregister FCM token
    await FirebaseNotificationService.unregisterToken(session.id, token);

    console.log(`FCM token unregistered for user ${session.email}`);

    return NextResponse.json({
      success: true,
      message: 'FCM token unregistered successfully'
    });

  } catch (error) {
    console.error('FCM token unregistration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}