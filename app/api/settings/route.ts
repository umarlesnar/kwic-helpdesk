//app/api/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET system settings
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const settings = await Database.getSystemSettings();
    return NextResponse.json(settings || {});
  } catch (error) {
    console.error('Get system settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update system settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const updated = await Database.updateSystemSettings(body);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update system settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
