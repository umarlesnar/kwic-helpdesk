// app/api/teams/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Team } from '@/lib/schemas';
import { getSessionFromRequest } from '@/lib/auth';
import { mongoDb } from '@/lib/mongodb';
import { withTransaction } from '@/lib/mongodb';


export const dynamic = 'force-dynamic';

// GET all teams
export async function GET(request: NextRequest) {
  try {
    await mongoDb.connect();
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can view all teams
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const teams = await Team.find({})
      .populate('members', 'name email role avatar')
      .populate('requestTypes', 'name description priority isActive')
      .populate('leadId', 'name email avatar')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(teams);
  } catch (error: unknown) {
    console.error('Get teams error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// POST create new team
export async function POST(request: NextRequest) {
  try {
    await mongoDb.connect();
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    // Use transaction for team creation
    const createdTeam = await withTransaction(async (session) => {
      // Check if team already exists
      const existingTeam = await Team.findOne({ name: body.name }).session(session);
      if (existingTeam) {
        throw new Error('Team with this name already exists');
      }

      const newTeam = new Team({
        name: body.name,
        description: body.description || '',
        members: body.members || [],
        requestTypes: body.requestTypes || [],
        leadId: body.leadId || null,
        isActive: body.isActive !== false,
        settings: {
          autoAssignment: body.settings?.autoAssignment ?? true,
          workingHours: {
            timezone: body.settings?.workingHours?.timezone || 'UTC',
            schedule: {
              monday: { enabled: true, start: '09:00', end: '17:00' },
              tuesday: { enabled: true, start: '09:00', end: '17:00' },
              wednesday: { enabled: true, start: '09:00', end: '17:00' },
              thursday: { enabled: true, start: '09:00', end: '17:00' },
              friday: { enabled: true, start: '09:00', end: '17:00' },
              saturday: { enabled: false, start: '09:00', end: '17:00' },
              sunday: { enabled: false, start: '09:00', end: '17:00' }
            }
          },
          escalationRules: body.settings?.escalationRules || []
        },
        metrics: {
          totalTickets: 0,
          resolvedTickets: 0,
          avgResolutionTime: 0,
          customerSatisfaction: 0
        }
      });

      return newTeam.save({ session });
    });

    return NextResponse.json(createdTeam, { status: 201 });
  } catch (error: unknown) {
    console.error('Create team error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const status = errorMessage.includes('already exists') ? 409 : 500;
    return NextResponse.json(
      { error: errorMessage },
      { status }
    );
  }
}