//app/api/webhooks/manage/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { Webhook } from '@/lib/schemas/webhook.schema';
import { WebhookDelivery } from '@/lib/schemas/webhookDelivery.schema';
import { WebhookService } from '@/lib/services/webhookService';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateWebhookSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  events: z.array(z.string()).min(1).optional(),
  isActive: z.boolean().optional(),
  headers: z.record(z.string()).optional(),
  retryPolicy: z.object({
    maxRetries: z.number().min(0).max(10),
    retryDelay: z.number().min(100),
    backoffMultiplier: z.number().min(1)
  }).optional(),
  timeout: z.number().min(1000).max(300000).optional()
});

/**
 * GET /api/webhooks/manage/[id]
 * Get webhook details with delivery statistics
 */
export async function GET(
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
    }).select('-secret');

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Get delivery statistics
    const deliveryStats = await WebhookService.getDeliveryStats(params.id);
    
    // Get recent deliveries
    const recentDeliveries = await WebhookDelivery.find({
      webhookId: params.id
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('event status responseStatus createdAt deliveredAt attempts');

    return NextResponse.json({
      success: true,
      webhook: {
        ...webhook.toObject(),
        deliveryStats,
        recentDeliveries
      }
    });

  } catch (error) {
    console.error('Get webhook details error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/webhooks/manage/[id]
 * Update webhook configuration
 */
export async function PATCH(
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

    const body = await request.json();
    const validation = updateWebhookSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: validation.error.errors 
        },
        { status: 422 }
      );
    }

    const webhook = await Webhook.findOneAndUpdate(
      { _id: params.id, createdBy: session.id },
      validation.data,
      { new: true, runValidators: true }
    ).select('-secret');

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    console.log('Webhook updated successfully:', params.id);

    return NextResponse.json({
      success: true,
      webhook
    });

  } catch (error) {
    console.error('Update webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/webhooks/manage/[id]
 * Delete webhook
 */
export async function DELETE(
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

    const webhook = await Webhook.findOneAndDelete({
      _id: params.id,
      createdBy: session.id
    });

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Delete associated delivery records
    await WebhookDelivery.deleteMany({ webhookId: params.id });

    console.log('Webhook deleted successfully:', params.id);

    return NextResponse.json({
      success: true,
      message: 'Webhook deleted successfully'
    });

  } catch (error) {
    console.error('Delete webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}