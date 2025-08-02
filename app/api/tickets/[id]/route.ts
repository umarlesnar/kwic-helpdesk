//app/api/tickets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Get ticket request received for ID:', params.id);
    
    const session = await getSessionFromRequest(request);
    if (!session) {
      console.log('No valid session found for get ticket');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Session found for user:', session.email);

    let ticket = await Database.getTicketById(params.id);
    if (Array.isArray(ticket)) ticket = ticket[0];
    if (!ticket) {
      console.log('Ticket not found:', params.id);
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Fetch the real user from MongoDB
    let user = await Database.getUserByEmail(session.email);
    if (Array.isArray(user)) user = user[0];
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 400 });
    }

    // Check access permissions
    if (session.role === 'customer' && String(ticket.customerId) !== String(user._id)) {
      console.log('Customer access denied for ticket:', params.id);
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get additional data
    let customer = await Database.getUserById(ticket.customerId);
    if (Array.isArray(customer)) customer = customer[0];
    let assignee = ticket.assigneeId ? await Database.getUserById(ticket.assigneeId) : null;
    if (Array.isArray(assignee)) assignee = assignee[0];
    let requestType = await Database.getRequestTypeById(ticket.requestTypeId);
    if (Array.isArray(requestType)) requestType = requestType[0];
    const activities = await Database.getTicketActivities(String(ticket._id));

    // Enrich activities with user data
    const enrichedActivities = await Promise.all(
      activities.map(async (activity) => {
        let user = await Database.getUserById(activity.userId);
        if (Array.isArray(user)) user = user[0];
        return {
          ...activity,
          user: user ? { id: user._id, name: user.name, email: user.email } : null,
        };
      })
    );

    console.log('Ticket retrieved successfully:', params.id);

    return NextResponse.json({
      ...ticket,
      customer: customer ? { id: customer._id, name: customer.name, email: customer.email } : null,
      assignee: assignee ? { id: assignee._id, name: assignee.name, email: assignee.email } : null,
      requestType: requestType ? { id: requestType._id, name: requestType.name, category: requestType.category } : null,
      activities: enrichedActivities,
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Update ticket request received for ID:', params.id);
    
    const session = await getSessionFromRequest(request);
    if (!session) {
      console.log('No valid session found for update ticket');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Session found for user:', session.email);

    const updates = await request.json();
    let ticket = await Database.getTicketById(params.id);
    if (Array.isArray(ticket)) ticket = ticket[0];
    
    if (!ticket) {
      console.log('Ticket not found for update:', params.id);
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Fetch the real user from MongoDB
    let user = await Database.getUserByEmail(session.email);
    if (Array.isArray(user)) user = user[0];
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 400 });
    }

    // Check permissions for updates
    if (session.role === 'customer' && String(ticket.customerId) !== String(user._id)) {
      // Customers can only update their own tickets and only certain fields
      const allowedFields = ['status'];
      const hasDisallowedFields = Object.keys(updates).some(key => !allowedFields.includes(key));
      if (hasDisallowedFields) {
        console.log('Customer access denied for ticket update:', params.id);
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Handle the special case for unassigning a ticket
    // If the assigneeId is sent as "unassigned" from the frontend, set it to null
    if (updates.assigneeId === 'unassigned') {
      updates.assigneeId = null;
    }

    // Ensure that an empty string for assigneeId is also treated as null
    // This handles cases where the frontend might send '' instead of 'unassigned'
    if (updates.assigneeId === '') {
      updates.assigneeId = null;
    }

    const updatedTicket = await Database.updateTicket(params.id, updates);

    if (!updatedTicket) {
      console.log('Ticket update failed (not found or invalid data):', params.id);
      return NextResponse.json({ error: 'Ticket not found or update failed (invalid data)' }, { status: 400 });
    }

    // Create activity for status changes
    if (updates.status && updates.status !== ticket.status) {
      await Database.createActivity({
        ticketId: String(ticket._id),
        userId: String(user._id),
        type: 'status_change',
        content: `Status changed from ${ticket.status} to ${updates.status}`,
        isInternal: false,
        metadata: { oldStatus: ticket.status, newStatus: updates.status },
      });
    }

    console.log('Ticket updated successfully:', params.id);

    return NextResponse.json(updatedTicket);
  } catch (error: any) {
    console.error('Update ticket error:', error);
    return NextResponse.json(
      { error: error?.message || error?.toString() || 'Internal server error' },
      { status: 500 }
    );
  }
}