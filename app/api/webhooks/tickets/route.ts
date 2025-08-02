//app/api/webhooks/tickets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database";
import { WebhookService } from "@/lib/services/webhookService";
import { z } from "zod";

export const dynamic = "force-dynamic";

// Validation schema for webhook ticket creation
const createTicketSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  requestTypeId: z.string().min(1, "Request type is required"),
  customerId: z.string().min(1, "Customer ID is required"),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  labels: z.array(z.string()).default([]),
  metadata: z.record(z.any()).optional(),
});

const webhookAuthSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  signature: z.string().optional(),
  timestamp: z.string().optional(),
});

/**
 * POST /api/webhooks/tickets
 * Create a ticket via webhook
 */
export async function POST(request: NextRequest) {
  try {
    console.log("Webhook ticket creation request received");

    // Verify webhook authentication
    const authHeader = request.headers.get("authorization");
    const signature = request.headers.get("x-webhook-signature");
    const timestamp = request.headers.get("x-webhook-timestamp");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Missing authorization header" },
        { status: 401 }
      );
    }

    const apiKey = authHeader.replace("Bearer ", "");

    // Validate auth data
    const authValidation = webhookAuthSchema.safeParse({
      apiKey,
      signature,
      timestamp,
    });

    if (!authValidation.success) {
      return NextResponse.json(
        {
          error: "Invalid authentication data",
          details: authValidation.error.errors,
        },
        { status: 401 }
      );
    }

    // TODO: Verify API key against stored webhook configurations
    // For now, we'll accept any non-empty API key
    if (!apiKey || apiKey.length < 10) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = createTicketSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validation.error.errors,
        },
        { status: 422 }
      );
    }

    const ticketData = validation.data;

    // Verify customer exists
    const customer = await Database.getUserById(ticketData.customerId);
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Verify request type exists
    const requestType = await Database.getRequestTypeById(
      ticketData.requestTypeId
    );
    if (!requestType) {
      return NextResponse.json(
        { error: "Request type not found" },
        { status: 404 }
      );
    }

    // Create the ticket
    const ticket = await Database.createTicket({
      title: ticketData.title,
      description: ticketData.description,
      requestTypeId: ticketData.requestTypeId,
      customerId: ticketData.customerId,
      status: "open",
      priority: ticketData.priority,
      labels: ticketData.labels,
      participants: [ticketData.customerId],
      approvers: [],
      // teamId: requestType.teamId,
    });

    // Create initial activity
    await Database.createActivity({
      ticketId: ticket.id,
      userId: ticketData.customerId,
      type: "comment",
      content: `Ticket created via webhook: ${ticketData.title}`,
      isInternal: false,
      metadata: {
        source: "webhook",
        apiKey: apiKey.substring(0, 8) + "...",
        ...ticketData.metadata,
      },
    });

    // Trigger webhook events
    await WebhookService.triggerWebhooks(
      "ticket.created",
      {
        ticket: {
          ...ticket,
          customer: {
            // id: customer.id,
            // name: customer.name,
            // email: customer.email,
          },
          requestType: {
            // id: requestType.id,
            // name: requestType.name,
            // category: requestType.category,
          },
        },
      },
      {
        ticketId: ticket.id,
        //customerId: customer.id,
        source: "webhook",
      }
    );

    console.log("Webhook ticket created successfully:", ticket.id);

    return NextResponse.json(
      {
        success: true,
        ticket: {
          id: ticket.id,
          ticketNumber: (ticket as any).ticketNumber,
          title: ticket.title,
          status: ticket.status,
          priority: ticket.priority,
          createdAt: ticket.createdAt,
          customer: {
            // id: customer.id,
            // name: customer.name,
            // email: customer.email,
          },
          requestType: {
            // id: requestType.id,
            // name: requestType.name,
            // category: requestType.category,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Webhook ticket creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/tickets/[ticketId]
 * Get ticket status via webhook
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const ticketId = url.searchParams.get("id");
    const ticketNumber = url.searchParams.get("ticketNumber");

    if (!ticketId && !ticketNumber) {
      return NextResponse.json(
        { error: "Ticket ID or ticket number is required" },
        { status: 400 }
      );
    }

    // Verify webhook authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Missing authorization header" },
        { status: 401 }
      );
    }

    const apiKey = authHeader.replace("Bearer ", "");
    if (!apiKey || apiKey.length < 10) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    // Find ticket by ID or ticket number
    let ticket;
    if (ticketNumber) {
      //ticket = await Database.getTicketByNumber(ticketNumber);
    } else {
      ticket = await Database.getTicketById(ticketId!);
    }

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Get additional data
    // const customer = await Database.getUserById(ticket.customerId);
    // const assignee = ticket.assigneeId
    //   ? await Database.getUserById(ticket.assigneeId)
    //   : null;
    // const requestType = await Database.getRequestTypeById(ticket.requestTypeId);
    // const activities = await Database.getTicketActivities(ticket.id);

    // console.log("Webhook ticket status retrieved:", ticket.id);

    return NextResponse.json({
      success: true,
      ticket: {
        // id: ticket.id,
        // ticketNumber: (ticket as any).ticketNumber,
        // title: ticket.title,
        // description: ticket.description,
        // status: ticket.status,
        // priority: ticket.priority,
        // labels: ticket.labels,
        // createdAt: ticket.createdAt,
        // updatedAt: ticket.updatedAt,
        // resolvedAt: ticket.resolvedAt,
        // customer: customer
        //   ? {
        //       id: customer.id,
        //       name: customer.name,
        //       email: customer.email,
        //     }
        //   : null,
        // assignee: assignee
        //   ? {
        //       id: assignee.id,
        //       name: assignee.name,
        //       email: assignee.email,
        //     }
        //   : null,
        // requestType: requestType
        //   ? {
        //       id: requestType.id,
        //       name: requestType.name,
        //       category: requestType.category,
        //     }
        //   : null,
        // activityCount: activities.length,
        // lastActivity:
        //   activities.length > 0
        //     ? activities[activities.length - 1].createdAt
        //     : null,
      },
    });
  } catch (error) {
    console.error("Webhook ticket status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
