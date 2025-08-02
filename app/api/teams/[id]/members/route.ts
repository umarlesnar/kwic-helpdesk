// app/api/teams/[id]/members/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Team, User } from '@/lib/schemas';
import { getSessionFromRequest } from '@/lib/auth';
import { mongoDb } from '@/lib/mongodb';
import { withTransaction } from '@/lib/mongodb';
import { Types } from 'mongoose';

interface SessionUser {
  role: string;
  [key: string]: any;
}

export const dynamic = 'force-dynamic';

// Add member to team
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await mongoDb.connect();
    const session = await getSessionFromRequest(request);
    if (!session || (session as SessionUser).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamId = params.id;
    if (!Types.ObjectId.isValid(teamId)) {
      return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 });
    }

    const body = await request.json();
    const userId = body.userId;
    
    if (!Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const updatedTeam = await withTransaction(async (session) => {
      // Check if user exists
      const user = await User.findById(userId).session(session);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user is already in team
      const team = await Team.findById(teamId).session(session);
      if (team?.members.includes(new Types.ObjectId(userId))) {
        throw new Error('User is already in this team');
      }

      return Team.findByIdAndUpdate(
        teamId,
        { $addToSet: { members: new Types.ObjectId(userId) } },
        { new: true, session }
      )
        .populate('members', 'name email role avatar')
        .populate('requestTypes', 'name description priority isActive')
        .populate('leadId', 'name email avatar');
    });

    return NextResponse.json(updatedTeam);
  } catch (error: unknown) {
    console.error('Add team member error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const status = errorMessage.includes('not found') ? 404 : 
                  errorMessage.includes('already in') ? 400 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status }
    );
  }
}

// Remove member from team
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await mongoDb.connect();
    const session = await getSessionFromRequest(request);
    if (!session || (session as SessionUser).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamId = params.id;
    if (!Types.ObjectId.isValid(teamId)) {
      return NextResponse.json({ error: 'Invalid team ID' }, { status: 400 });
    }

    const body = await request.json();
    const userId = body.userId;
    
    if (!Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const updatedTeam = await withTransaction(async (session) => {
      return Team.findByIdAndUpdate(
        teamId,
        { $pull: { members: new Types.ObjectId(userId) } },
        { new: true, session }
      )
        .populate('members', 'name email role avatar')
        .populate('requestTypes', 'name description priority isActive')
        .populate('leadId', 'name email avatar');
    });

    return NextResponse.json(updatedTeam);
  } catch (error: unknown) {
    console.error('Remove team member error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}