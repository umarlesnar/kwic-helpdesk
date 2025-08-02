//app/api/tickets/[id]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';
import { getSessionFromRequest } from '@/lib/auth';
import { Media } from '@/lib/schemas/media.schema';
import { connectToDatabase } from '@/lib/database';

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

    const { content, isInternal = false, media = [] } = await request.json();

    if (!content && (!media || media.length === 0)) {
      return NextResponse.json(
        { error: 'Content or media is required' },
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

    // Associate media with the activity if provided
    let attachments = [];
    if (media && media.length > 0) {
      try {
        console.log('Associating media with activity:', activity._id, 'Media IDs:', media);
        
        // Ensure database connection
        await connectToDatabase();
        
        // Update media to associate with this activity
        const updatedMedia = await Media.updateMany(
          { _id: { $in: media } },
          { 
            $set: { 
              'associatedWith.type': 'activity',
              'associatedWith.id': activity._id
            }
          }
        );
        
        console.log('Media update result:', updatedMedia);

        // Get the media objects for attachments
        const mediaObjects = await Media.find({ _id: { $in: media } });
        console.log('Found media objects:', mediaObjects.length);
        
        attachments = mediaObjects.map(m => ({
          filename: m.filename,
          originalName: m.originalName,
          mimeType: m.mimeType,
          size: m.size,
          url: m.url
        }));

        // Update the activity with attachments
        const updatedActivity = await Database.updateActivity(activity._id, { attachments });
        console.log('Activity updated with attachments:', updatedActivity);
        
      } catch (error) {
        console.error('Error associating media with activity:', error);
      }
    }

    console.log('Comment added successfully to ticket:', params.id);

    return NextResponse.json({
      ...activity,
      attachments,
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