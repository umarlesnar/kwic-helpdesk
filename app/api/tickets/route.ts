//app/api/tickets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';
import { getSessionFromRequest } from '@/lib/auth';
import { Media } from '@/lib/schemas/media.schema';
import { connectToDatabase } from '@/lib/schemas';
import mongoose from 'mongoose';

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

    const { title, description, requestTypeId, priority = 'medium', media = [] } = await request.json();

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

    // Ensure database connection
    await connectToDatabase();

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

    // Process media attachments if provided
    let attachments: Array<{
      filename: string;
      originalName: string;
      mimeType: string;
      size: number;
      url: string;
    }> = [];
    
    if (media && media.length > 0) {
      try {
        console.log('Processing media for ticket creation, Media IDs:', media);
        
        // Convert media IDs to ObjectIds and filter out invalid ones
        const mediaObjectIds = media
          .filter((id: any) => id && mongoose.Types.ObjectId.isValid(id))
          .map((id: string) => new mongoose.Types.ObjectId(id));
        
        console.log('Valid media ObjectIds:', mediaObjectIds);
        
        if (mediaObjectIds.length > 0) {
          // Get the media objects first
          const mediaObjects = await Media.find({ _id: { $in: mediaObjectIds } });
          console.log('Found media objects for ticket:', mediaObjects.length);
          
          if (mediaObjects.length > 0) {
            // Create attachments array for the activity
            attachments = mediaObjects.map(m => ({
              filename: m.filename,
              originalName: m.originalName,
              mimeType: m.mimeType,
              size: m.size,
              url: m.url
            }));

            // Convert ticket._id to ObjectId  
            const ticketObjectId = mongoose.Types.ObjectId.isValid(ticket._id) 
              ? new mongoose.Types.ObjectId(ticket._id) 
              : ticket._id;
            
            // Update media to associate with this ticket
            const updatedMedia = await Media.updateMany(
              { _id: { $in: mediaObjectIds } },
              { 
                $set: { 
                  'associatedWith.type': 'ticket',
                  'associatedWith.id': ticketObjectId
                }
              }
            );
            
            console.log('Media association update result:', updatedMedia);
          }
        }
        
      } catch (error) {
        console.error('Error processing media for ticket:', error);
      }
    }

    // Create initial activity with attachments
    await Database.createActivity({
      ticketId: ticket._id,
      userId: user._id,
      type: 'comment',
      content: `Ticket created: ${title}`,
      isInternal: false,
      attachments,
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