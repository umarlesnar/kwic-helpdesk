//app/api/users/actions.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, User } from '@/lib/schemas';

function getAuthToken(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.replace('Bearer ', '').trim();
}

async function isAdmin(token: string) {
  return !!token;
}

export async function GET(req: NextRequest) {
  // ...existing code...
}

export async function POST(req: NextRequest) {
  // ...existing code...
}

export async function DELETE(req: NextRequest) {
  const token = getAuthToken(req);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await isAdmin(token))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  await connectToDatabase();
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
    }
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const token = getAuthToken(req);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await isAdmin(token))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  await connectToDatabase();
  try {
    const { id, updates } = await req.json();
    if (!id || !updates) {
      return NextResponse.json({ error: 'Missing user id or updates' }, { status: 400 });
    }
    const updated = await User.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
