// app/api/teams/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Team } from '@/lib/schemas';
import { getSessionFromRequest } from '@/lib/auth';
import { mongoDb } from '@/lib/mongodb';
import { withTransaction } from '@/lib/mongodb';
import { Types } from 'mongoose';

interface SessionUser {
  role: string;
  userId: string;
  [key: string]: any;
}

export const dynamic = 'force-dynamic';

// GET single team
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await mongoDb.connect();
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamId = params.id;
    if (!Types.ObjectId.isValid(teamId)) {
      return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 });
    }

    const team = await Team.findById(teamId)
      .populate('members', 'name email role avatar')
      .populate('requestTypes', 'name description priority isActive')
      .populate('leadId', 'name email avatar')
      .lean();

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Only admins or team members can view team details
    const sessionUser = session as unknown as SessionUser;
    if (sessionUser.role !== 'admin' && 
        !(team as any).members.some((m: any) => m._id.toString() === sessionUser.userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(team);
  } catch (error: unknown) {
    console.error('Get team error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// PUT update team
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await mongoDb.connect();
    const session = await getSessionFromRequest(request);
    if (!session || (session as unknown as SessionUser).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamId = params.id;
    if (!Types.ObjectId.isValid(teamId)) {
      return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, description } = body;
    if (!name) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    const updatedTeam = await withTransaction(async (session) => {
      return Team.findByIdAndUpdate(
        teamId,
        { name, description },
        { new: true, session }
      )
        .populate('members', 'name email role avatar')
        .populate('requestTypes', 'name description priority isActive')
        .populate('leadId', 'name email avatar');
    });

    if (!updatedTeam) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    return NextResponse.json(updatedTeam);
  } catch (error: unknown) {
    console.error('Update team error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE team
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await mongoDb.connect();
    const session = await getSessionFromRequest(request);
    if (!session || (session as unknown as unknown as SessionUser).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamId = params.id;
    if (!Types.ObjectId.isValid(teamId)) {
      return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 });
    }

    const deleted = await withTransaction(async (session) => {
      return Team.findByIdAndDelete(teamId).session(session);
    });

    if (!deleted) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'Team deleted successfully' },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Delete team error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}