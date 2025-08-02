//app/api/webhooks/manage/[id]/test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { Webhook } from '@/lib/schemas/webhook.schema';
import { WebhookService } from '@/lib/services/webhookService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/manage/[id]/test
 * Test webhook endpoint
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const webhook = await Webhook.findOne({
      _id: params.id,
      createdBy: session.id
    });

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    const testResult = await WebhookService.testWebhook(params.id);

    console.log('Webhook test completed:', params.id, testResult);

    return NextResponse.json({
      success: true,
      testResult
    });

  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}