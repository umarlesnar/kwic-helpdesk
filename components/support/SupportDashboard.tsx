//components/support/SupportDashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/shared/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Ticket, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp,
  Users,
  Timer,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export function SupportDashboard() {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, ticketsRes] = await Promise.all([
          fetch('/api/dashboard/metrics', {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch('/api/tickets?limit=5', {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
        ]);

        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          setMetrics(metricsData);
        }

        if (ticketsRes.ok) {
          const ticketsData = await ticketsRes.json();
          setRecentTickets(ticketsData.slice(0, 5));
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-green-500 text-white rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-2">Support Dashboard</h1>
        <p className="text-blue-100 mb-6">
          Monitor tickets, track performance, and manage customer support efficiently.
        </p>
        <div className="flex gap-4">
          <Link href="/support/tickets">
            <Button className="bg-white text-green-600 hover:bg-gray-100">
              <Ticket className="h-4 w-4 mr-2" />
              View All Tickets
            </Button>
          </Link>
          <Link href="/support/tickets?status=open">
            <Button variant="outline" className="border-white text-green-600  hover:text-green-600 ">
              <Clock className="h-4 w-4 mr-2" />
              Open Tickets
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                <p className="text-3xl font-bold  text-blue-600">
                  {metrics?.totalTickets || 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Ticket className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                <p className="text-3xl font-bold text-orange-600">
                  {metrics?.openTickets || 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved Today</p>
                <p className="text-3xl font-bold text-green-600">
                  {metrics?.resolvedTickets || 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Resolution</p>
                <p className="text-3xl font-bold text-purple-600">
                  {metrics?.avgResolutionTime || 0}h
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Timer className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Tickets */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Tickets</CardTitle>
              <Link href="/support/tickets">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
            <CardDescription>
              Latest support requests requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTickets.length > 0 ? (
                recentTickets.map((ticket) => (
                  <div key={ticket._id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 truncate">
                          <Link 
                            href={`/support/tickets/${ticket._id}`}
                            className="hover:text-blue-600"
                          >
                            {ticket.title}
                          </Link>
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                        {ticket.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>#{ticket._id}</span>
                        <span>{ticket.customer?.name}</span>
                        <span>{format(new Date(ticket.createdAt), 'MMM d, h:mm a')}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-4">
                      <Badge className={`${getStatusColor(ticket.status)} border-0 text-xs`}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={`${getPriorityColor(ticket.priority)} border-0 text-xs`}>
                        {ticket.priority}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Ticket className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent tickets</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>
              Key metrics and trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Response Time</p>
                    <p className="text-sm text-gray-600">Average first response</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">2.4h</p>
                  <p className="text-xs text-green-600">↓ 15% from last week</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Resolution Rate</p>
                    <p className="text-sm text-gray-600">Tickets resolved today</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">94%</p>
                  <p className="text-xs text-green-600">↑ 3% from yesterday</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium">High Priority</p>
                    <p className="text-sm text-gray-600">Urgent tickets pending</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-600">
                    {metrics?.ticketsByPriority?.high || 0}
                  </p>
                  <p className="text-xs text-gray-500">Requires attention</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Customer Satisfaction</p>
                    <p className="text-sm text-gray-600">Average rating</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-600">4.8</p>
                  <p className="text-xs text-green-600">↑ 0.2 from last month</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/support/tickets?status=open">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="h-4 w-4 mr-2" />
                Open Tickets
              </Button>
            </Link>
            <Link href="/support/tickets?priority=high,critical">
              <Button variant="outline" className="w-full justify-start">
                <AlertTriangle className="h-4 w-4 mr-2" />
                High Priority
              </Button>
            </Link>
            <Link href="/support/my-tickets">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                My Assignments
              </Button>
            </Link>
            <Link href="/support/analytics">
              <Button variant="outline" className="w-full justify-start">
                <Activity className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}