//app/api/webhooks/retry/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { WebhookService } from '@/lib/services/webhookService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/retry
 * Process webhook retry queue (for cron jobs or manual triggers)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal request or has proper authorization
    const authHeader = request.headers.get('authorization');
    const internalKey = process.env.INTERNAL_API_KEY || 'internal-webhook-retry-key';
    
    if (!authHeader || authHeader !== `Bearer ${internalKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Processing webhook retry queue...');
    
    await WebhookService.processRetryQueue();
    
    return NextResponse.json({
      success: true,
      message: 'Webhook retry queue processed successfully'
    });

  } catch (error) {
    console.error('Webhook retry processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}