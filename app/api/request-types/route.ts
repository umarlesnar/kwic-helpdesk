//app/api/request-types/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('Request types request received');
    // Optionally allow unauthenticated access for public request types
    const session = await getSessionFromRequest(request);
    if (!session) {
      console.log('No valid session found for request types');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('Session found for user:', session.email, 'role:', session.role);
    // Fetch all request types (active only for non-admin, all for admin)
    let requestTypes;
    if (session.role === 'admin') {
      requestTypes = await Database.getRequestTypes({ includeInactive: true });
    } else {
      requestTypes = await Database.getRequestTypes();
    }
    console.log('Request types retrieved successfully:', requestTypes.length);
    return NextResponse.json(requestTypes);
  } catch (error) {
    console.error('Get request types error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    // Map flat form fields to schema structure
    const newRequestType = {
      name: body.name,
      description: body.description,
      category: body.category,
      priority: body.priority,
      sla: {
        responseTime: body.sla || 24,
        resolutionTime: body.sla ? body.sla * 3 : 72,
        businessHoursOnly: true,
      },
      isActive: body.isActive,
      workflow: {
        allowedStatuses: ['open', 'in_progress', 'resolved', 'closed'],
        defaultStatus: 'open',
        autoAssignment: true,
        requireApproval: false,
        approvers: [],
      },
      customFields: [],
      templates: {},
      metrics: { totalTickets: 0, avgResolutionTime: 0, customerSatisfaction: 0 },
    };
    const created = await Database.createRequestType(newRequestType);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Create request type error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}