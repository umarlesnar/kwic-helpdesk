//app/api/dashboard/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Database } from '@/lib/database';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('Dashboard metrics request received');
    
    const session = await getSessionFromRequest(request);
    if (!session) {
      console.log('No valid session found for dashboard metrics');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Session found for user:', session.email, 'role:', session.role);


    if (session.role === 'customer') {
      console.log('Customer tried to access dashboard metrics');
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch metrics
    const metrics = await Database.getDashboardMetrics();
    // Fetch total users for dashboard
    const users = await Database.getUsers();
    // User role breakdown
    const userRoles = users.reduce((acc: any, user: any) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    const totalUsers = users.length;
    const userRolesPercent = Object.fromEntries(
      Object.entries(userRoles).map(([role, count]) => [role, totalUsers ? Math.round((count as number) * 100 / totalUsers) : 0])
    );
    // Optionally, calculate a performance score (example: based on resolved/open tickets)
    let performanceScore = 98;
    if (metrics.totalTickets > 0) {
      performanceScore = Math.round((metrics.resolvedTickets / metrics.totalTickets) * 100);
    }
    // Add totalUsers, userRoles, userRolesPercent, and performanceScore to metrics response
    const response = {
      ...metrics,
      totalUsers,
      userRoles,
      userRolesPercent,
      performanceScore,
    };
    console.log('Dashboard metrics retrieved successfully');
    return NextResponse.json(response);
  } catch (error) {
    console.error('Get dashboard metrics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}