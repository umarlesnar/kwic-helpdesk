//app/api/tickets/[id]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Add comment request received for ticket ID:', params.id);
    
    const session = await getSessionFromRequest(request);
    if (!session) {
      console.log('No valid session found for add comment');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Session found for user:', session.email);

    const { content, isInternal = false } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    let ticket = await Database.getTicketById(params.id);
    if (Array.isArray(ticket)) ticket = ticket[0];
    if (!ticket) {
      console.log('Ticket not found for comment:', params.id);
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
      console.log('Customer access denied for comment on ticket:', params.id);
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Customers cannot create internal comments
    if (session.role === 'customer' && isInternal) {
      console.log('Customer tried to create internal comment');
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

        const activity = await Database.createActivity({
      ticketId: String(params.id),
      userId: String(user._id),
      type: 'comment',
      content,
      isInternal,
    });

    console.log('Comment added successfully to ticket:', params.id);

    return NextResponse.json({
      ...activity,
      user: user ? { id: user._id, name: user.name, email: user.email } : null,
    }, { status: 201 });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}