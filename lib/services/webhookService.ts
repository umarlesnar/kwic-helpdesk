//lib/services/webhookService.ts
import crypto from 'crypto';
import { Webhook, IWebhook, WebhookEvent } from '@/lib/schemas/webhook.schema';
import { WebhookDelivery, IWebhookDelivery } from '@/lib/schemas/webhookDelivery.schema';

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: any;
  metadata?: {
    ticketId?: string;
    userId?: string;
    teamId?: string;
    [key: string]: any;
  };
}

export class WebhookService {
  /**
   * Trigger webhooks for a specific event
   */
  static async triggerWebhooks(event: WebhookEvent, data: any, metadata?: any): Promise<void> {
    try {
      console.log(`Triggering webhooks for event: ${event}`);
      
      // Find all active webhooks that listen to this event
      const webhooks = await Webhook.find({
        isActive: true,
        events: event
      });

      if (webhooks.length === 0) {
        console.log(`No webhooks found for event: ${event}`);
        return;
      }

      // Create payload
      const payload: WebhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        data,
        metadata
      };

      // Queue webhook deliveries
      const deliveryPromises = webhooks.map(webhook => 
        this.queueWebhookDelivery(webhook, payload)
      );

      await Promise.allSettled(deliveryPromises);
      console.log(`Queued ${webhooks.length} webhook deliveries for event: ${event}`);
    } catch (error) {
      console.error('Error triggering webhooks:', error);
    }
  }

  /**
   * Queue a webhook delivery
   */
  private static async queueWebhookDelivery(webhook: IWebhook, payload: WebhookPayload): Promise<void> {
    try {
      // Create webhook delivery record
      const delivery = new WebhookDelivery({
        webhookId: webhook._id,
        event: payload.event,
        payload,
        url: webhook.url,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Helpdesk-Webhook/1.0',
          'X-Webhook-Event': payload.event,
          'X-Webhook-Timestamp': payload.timestamp,
          'X-Webhook-Signature': this.generateSignature(payload, webhook.secret),
          ...webhook.headers
        }
      });

      await delivery.save();

      // Immediately attempt delivery
      await this.attemptDelivery(delivery);
    } catch (error) {
      console.error('Error queueing webhook delivery:', error);
    }
  }

  /**
   * Attempt webhook delivery
   */
  private static async attemptDelivery(delivery: IWebhookDelivery): Promise<void> {
    const startTime = Date.now();
    let attempt = {
      attemptNumber: delivery.attempts.length + 1,
      timestamp: new Date(),
      responseTime: 0,
      errorMessage: undefined as string | undefined
    };

    try {
      console.log(`Attempting webhook delivery ${attempt.attemptNumber} for ${delivery.event}`);

      const webhook = await Webhook.findById(delivery.webhookId);
      if (!webhook) {
        throw new Error('Webhook not found');
      }

      // Make HTTP request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), webhook.timeout);

      const response = await fetch(delivery.url, {
        method: delivery.httpMethod,
        headers: delivery.headers,
        body: JSON.stringify(delivery.payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      attempt.responseTime = Date.now() - startTime;

      // Update delivery record
      delivery.responseStatus = response.status;
      delivery.responseHeaders = Object.fromEntries(response.headers.entries());
      delivery.responseBody = await response.text();

      if (response.ok) {
        // Success
        delivery.status = 'success';
        delivery.deliveredAt = new Date();
        
        // Update webhook stats
        await Webhook.findByIdAndUpdate(webhook._id, {
          $inc: { 
            totalDeliveries: 1,
            successfulDeliveries: 1
          },
          lastTriggered: new Date()
        });

        console.log(`Webhook delivery successful for ${delivery.event}`);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      attempt.responseTime = Date.now() - startTime;
      attempt.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`Webhook delivery failed for ${delivery.event}:`, attempt.errorMessage);
      
      // Check if we should retry
      const webhook = await Webhook.findById(delivery.webhookId);
      if (webhook && attempt.attemptNumber < webhook.retryPolicy.maxRetries) {
        // Schedule retry
        const delay = webhook.retryPolicy.retryDelay * 
          Math.pow(webhook.retryPolicy.backoffMultiplier, attempt.attemptNumber - 1);
        
        delivery.status = 'retrying';
        delivery.nextRetryAt = new Date(Date.now() + delay);
        delivery.errorMessage = attempt.errorMessage;
        
        console.log(`Scheduling retry ${attempt.attemptNumber + 1} in ${delay}ms`);
      } else {
        // Max retries reached or no webhook found
        delivery.status = 'failed';
        delivery.errorMessage = attempt.errorMessage;
        
        // Update webhook stats
        if (webhook) {
          await Webhook.findByIdAndUpdate(webhook._id, {
            $inc: { 
              totalDeliveries: 1,
              failedDeliveries: 1
            },
            lastTriggered: new Date()
          });
        }
        
        console.log(`Webhook delivery permanently failed for ${delivery.event}`);
      }
    } finally {
      // Add attempt to delivery record
      delivery.attempts.push(attempt);
      await delivery.save();
    }
  }

  /**
   * Process retry queue
   */
  static async processRetryQueue(): Promise<void> {
    try {
      const now = new Date();
      const pendingRetries = await WebhookDelivery.find({
        status: 'retrying',
        nextRetryAt: { $lte: now }
      }).limit(100); // Process in batches

      console.log(`Processing ${pendingRetries.length} webhook retries`);

      for (const delivery of pendingRetries) {
        await this.attemptDelivery(delivery);
      }
    } catch (error) {
      console.error('Error processing webhook retry queue:', error);
    }
  }

  /**
   * Generate webhook signature for security
   */
  private static generateSignature(payload: any, secret: string): string {
    const payloadString = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
  }

  /**
   * Verify webhook signature
   */
  static verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Get webhook delivery statistics
   */
  static async getDeliveryStats(webhookId: string, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await WebhookDelivery.aggregate([
      {
        $match: {
          webhookId: webhookId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgResponseTime: { $avg: { $arrayElemAt: ['$attempts.responseTime', -1] } }
        }
      }
    ]);

    return stats;
  }

  /**
   * Test webhook endpoint
   */
  static async testWebhook(webhookId: string): Promise<{ success: boolean; message: string; responseTime: number }> {
    const startTime = Date.now();
    
    try {
      const webhook = await Webhook.findById(webhookId);
      if (!webhook) {
        return { success: false, message: 'Webhook not found', responseTime: 0 };
      }

      const testPayload: WebhookPayload = {
        event: 'ticket.created',
        timestamp: new Date().toISOString(),
        data: {
          test: true,
          message: 'This is a test webhook delivery'
        }
      };

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': 'test',
          'X-Webhook-Signature': this.generateSignature(testPayload, webhook.secret),
          ...webhook.headers
        },
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(webhook.timeout)
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        return { 
          success: true, 
          message: `Test successful (${response.status})`, 
          responseTime 
        };
      } else {
        return { 
          success: false, 
          message: `HTTP ${response.status}: ${response.statusText}`, 
          responseTime 
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error', 
        responseTime 
      };
    }
  }
}