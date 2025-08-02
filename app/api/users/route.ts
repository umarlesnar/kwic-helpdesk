//app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, User } from '@/lib/schemas';

// Helper to check for Bearer token and optionally role
function getAuthToken(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.replace('Bearer ', '').trim();
}

// TODO: Replace with your real auth/role check
async function isAdmin(token: string) {
  // For now, allow all tokens; implement real check as needed
  return !!token;
}

export async function GET(req: NextRequest) {
  const token = getAuthToken(req);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await connectToDatabase();
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const query: any = {};
    if (role) query.role = role;
    if (role === 'agent') query.isActive = true;
    const users = await User.find(query).lean();
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const token = getAuthToken(req);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await isAdmin(token))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  await connectToDatabase();
  try {
    const body = await req.json();
    if (!body.name || !body.email || !body.role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    // Check for duplicate email
    const existing = await User.findOne({ email: body.email });
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
    // Set a default password for demo; in production, require password
    const user = await User.create({
      auth_type: body.role === 'customer' ? 'sso' : 'local',
      name: body.name,
      email: body.email,
      role: body.role,
      password: body.role === 'customer' ? "" : body.password || 'defaultPassword123',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      emailVerified: false,
      preferences: {
        notifications: { email: true, browser: true, ticketUpdates: true, comments: true },
        theme: 'system',
        language: 'en',
        timezone: 'UTC',
      },
      profile: {},
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
