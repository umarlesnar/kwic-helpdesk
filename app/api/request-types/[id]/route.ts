//app/api/request-types/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = params;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const type = await Database.getRequestTypeById(id);
    if (!type) return NextResponse.json({ error: 'Request type not found' }, { status: 404 });
    return NextResponse.json(type);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = params;
    const updates = await request.json();
    if (!id || !updates) {
      return NextResponse.json({ error: 'Missing id or updates' }, { status: 400 });
    }
    const updated = await Database.updateRequestType(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Request type not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = params;
    const updates = await request.json();
    if (!id || !updates) {
      return NextResponse.json({ error: 'Missing id or updates' }, { status: 400 });
    }
    const updated = await Database.updateRequestType(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Request type not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    const deleted = await Database.deleteRequestType(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Request type not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
