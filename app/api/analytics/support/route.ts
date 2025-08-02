//app/api/analytics/support/route.ts
import { NextResponse } from 'next/server';
import { Database } from '@/lib/database';

export async function GET() {
  try {
    // Fetch all tickets
    const tickets = await Database.getTickets();
    // Example analytics: total tickets, open, closed, resolved, by assignee
    const total = tickets.length;
    const open = tickets.filter(t => t.status === 'open').length;
    const inProgress = tickets.filter(t => t.status === 'in_progress').length;
    const resolved = tickets.filter(t => t.status === 'resolved').length;
    const closed = tickets.filter(t => t.status === 'closed').length;
    const cancelled = tickets.filter(t => t.status === 'cancelled').length;
    // Group by assignee (top 5)
    const byAssignee = Object.values(
      tickets.reduce((acc: any, t: any) => {
        const name = t.assignee?.name || 'Unassigned';
        acc[name] = acc[name] || { name, count: 0 };
        acc[name].count++;
        return acc;
      }, {})
    ).sort((a: any, b: any) => b.count - a.count).slice(0, 5);
    return NextResponse.json({ total, open, inProgress, resolved, closed, cancelled, byAssignee });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
