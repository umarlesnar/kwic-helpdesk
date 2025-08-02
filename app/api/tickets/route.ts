//app/api/tickets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';
import { getSessionFromRequest } from '@/lib/auth';

import { TicketUtils } from '@/lib/utils/ticketUtils';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('Tickets request received');
    
    const session = await getSessionFromRequest(request);
    if (!session) {
      console.log('No valid session found for tickets');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Session found for user:', session.email, 'role:', session.role);

    const url = new URL(request.url);
    const statusParam = url.searchParams.get('status');
    const priority = url.searchParams.getAll('priority');
    const assigneeId = url.searchParams.get('assigneeId'); // NEW

    const filters: any = {};
    
    if (session.role === 'customer') {
      // Fetch the real user from MongoDB
      const userResult = await Database.getUserByEmail(session.email);
      const user = Array.isArray(userResult) ? userResult[0] : userResult;
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 400 });
      }
      filters.customerId = user._id;
    }

    if (assigneeId) {
      filters.assigneeId = assigneeId;
    }
    
    if (statusParam) {
      filters.status = statusParam.split(',');
    }
    
    if (priority.length > 0) {
      filters.priority = priority;
    }

    const tickets = await Database.getTickets(filters);
    console.log('Tickets retrieved successfully:', tickets.length);
    
    // Get additional data for each ticket
    const enrichedTickets = await Promise.all(
      tickets.map(async (ticket) => {
        let customer = await Database.getUserById(ticket.customerId);
        if (Array.isArray(customer)) customer = customer[0];
        let assignee = ticket.assigneeId ? await Database.getUserById(ticket.assigneeId) : null;
        if (Array.isArray(assignee)) assignee = assignee[0];
        let requestType = await Database.getRequestTypeById(ticket.requestTypeId);
        if (Array.isArray(requestType)) requestType = requestType[0];
        return {
          ...ticket,
          customer: customer ? { id: customer._id, name: customer.name, email: customer.email } : null,
          assignee: assignee ? { id: assignee._id, name: assignee.name, email: assignee.email } : null,
          requestType: requestType ? { id: requestType._id, name: requestType.name, category: requestType.category } : null,
        };
      })
    );

    return NextResponse.json(enrichedTickets);
  } catch (error) {
    console.error('Get tickets error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Create ticket request received');
    
    const session = await getSessionFromRequest(request);
    if (!session) {
      console.log('No valid session found for create ticket');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Session found for user:', session.email);

    const { title, description, requestTypeId, priority = 'medium' } = await request.json();

    if (!title || !description || !requestTypeId) {
      return NextResponse.json(
        { error: 'Title, description, and request type are required' },
        { status: 400 }
      );
    }

    // Fetch the real user from MongoDB to get the ObjectId
    let user = await Database.getUserByEmail(session.email);
    if (Array.isArray(user)) user = user[0];
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 400 });
    }

    let requestTypeObj = await Database.getRequestTypeById(requestTypeId);
    if (Array.isArray(requestTypeObj)) requestTypeObj = requestTypeObj[0];
    const requestType = requestTypeObj;
    if (!requestType) {
      return NextResponse.json(
        { error: 'Invalid request type' },
        { status: 400 }
      );
    }

    // Generate ticket number
    const { ticketNumber } = await TicketUtils.generateTicketNumber();

    const ticket = await Database.createTicket({
      title,
      description,
      requestTypeId,
      customerId: user._id,
      status: 'open',
      priority,
      labels: [],
      participants: [user._id],
      approvers: [],
      teamId: requestType.teamId,
    });

    // Create initial activity
    await Database.createActivity({
      ticketId: ticket._id,
      userId: user._id,
      type: 'comment',
      content: `Ticket created: ${title}`,
      isInternal: false,
    });

    console.log('Ticket created successfully:', ticket._id);

    return NextResponse.json(ticket, { status: 201 });
  } catch (error: any) {
    console.error('Create ticket error:', error);
    return NextResponse.json(
      { error: error?.message || error?.toString() || 'Internal server error' },
      { status: 500 }
    );
  }
}