//app/api/webhooks/manage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { Webhook } from '@/lib/schemas/webhook.schema';
import { WebhookService } from '@/lib/services/webhookService';
import { z } from 'zod';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const createWebhookSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Invalid URL'),
  events: z.array(z.string()).min(1, 'At least one event is required'),
  headers: z.record(z.string()).default({}),
  retryPolicy: z.object({
    maxRetries: z.number().min(0).max(10).default(3),
    retryDelay: z.number().min(100).default(1000),
    backoffMultiplier: z.number().min(1).default(2)
  }).default({}),
  timeout: z.number().min(1000).max(300000).default(30000)
});

/**
 * GET /api/webhooks/manage
 * List all webhooks for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can manage webhooks
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const webhooks = await Webhook.find({ createdBy: session.id })
      .sort({ createdAt: -1 })
      .select('-secret'); // Don't expose secrets

    return NextResponse.json({
      success: true,
      webhooks
    });

  } catch (error) {
    console.error('Get webhooks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/webhooks/manage
 * Create a new webhook
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can manage webhooks
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const validation = createWebhookSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          details: validation.error.errors 
        },
        { status: 422 }
      );
    }

    const webhookData = validation.data;

    // Generate a secure secret
    const secret = crypto.randomBytes(32).toString('hex');

    // Create webhook
    const webhook = new Webhook({
      ...webhookData,
      secret,
      createdBy: session.id
    });

    await webhook.save();

    // Test the webhook endpoint
    const testResult = await WebhookService.testWebhook(webhook._id.toString());

    console.log('Webhook created successfully:', webhook._id);

    return NextResponse.json({
      success: true,
      webhook: {
        id: webhook._id,
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
        isActive: webhook.isActive,
        secret: secret, // Only return secret on creation
        testResult,
        createdAt: webhook.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Create webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}