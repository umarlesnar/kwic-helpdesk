//app/api/media/reassign/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { Media } from '@/lib/schemas/media.schema';
import { TicketActivity } from '@/lib/schemas/ticketActivity.schema';


export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { oldAssociatedId, newAssociatedId, type } = await req.json();

    if (!oldAssociatedId || !newAssociatedId || !type) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const filter: any = {
      'associatedWith.type': type,
      'associatedWith.id': oldAssociatedId,
    };

    if (session.role !== 'admin') {
      filter.uploadedBy = session.id;
    }

    // Step 1: Update associatedWith.id from old to new
    const result = await Media.updateMany(
      filter,
      { 'associatedWith.id': newAssociatedId }
    );

    // Step 2: Fetch updated media docs
    const updatedMedia = await Media.find({
      'associatedWith.type': type,
      'associatedWith.id': newAssociatedId
    }, 'filename originalName mimeType size url'); // only needed fields

    // Step 3: Prepare media for attachments
    const mediaForAttachments = updatedMedia.map(m => ({
      filename: m.filename,
      originalName: m.originalName,
      mimeType: m.mimeType,
      size: m.size,
      url: m.url
    }));

    // Step 4: Update TicketActivity attachments field
    if (type === 'activity') {
      await TicketActivity.findByIdAndUpdate(
        newAssociatedId,
        { attachments: mediaForAttachments }
      );
    }

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
      updatedAttachments: mediaForAttachments
    });
  } catch (error) {
    console.error('Reassign media error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}