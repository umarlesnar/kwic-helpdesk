//components/admin/AdminDashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/shared/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Ticket,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  UserCheck,
  Settings,
  Activity,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export function AdminDashboard() {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/dashboard/metrics', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchMetrics();
    }
  }, [token]);

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
      <div className="bg-green-400 text-white rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-white mb-6">
          Manage users, teams, and system configuration. Monitor overall platform health and performance.
        </p>
        <div className="flex gap-4">
          <Link href="/admin/users">
            <Button className="bg-white text-green-600 hover:bg-gray-100 hover:text-green-600">
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
          </Link>
          <Link href="/admin/settings">
            <Button variant="outline" className="border-white   text-green-600 hover:text-green-600">
              <Settings className="h-4 w-4 mr-2" />
              System Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{metrics?.totalUsers || 0}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600">↑ 12%</span>
              <span className="text-gray-500 ml-2">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Tickets</p>
                <p className="text-3xl font-bold text-orange-600">
                  {metrics?.openTickets || 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Ticket className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-red-600">↑ 8%</span>
              <span className="text-gray-500 ml-2">from yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
                <p className="text-3xl font-bold text-green-600">94.2%</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600">↑ 2.1%</span>
              <span className="text-gray-500 ml-2">from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response</p>
                <p className="text-3xl font-bold text-purple-600">2.4h</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600">↓ 15%</span>
              <span className="text-gray-500 ml-2">improvement</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>
              Monitor key system metrics and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Activity className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">System Status</p>
                    <p className="text-sm text-gray-600">All systems operational</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800 border-0">
                  Healthy
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Active Users</p>
                    <p className="text-sm text-gray-600">Users online now</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">42</p>
                  <p className="text-xs text-gray-500">Peak: 67 today</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium">Pending Actions</p>
                    <p className="text-sm text-gray-600">Items requiring attention</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-yellow-600">3</p>
                  <p className="text-xs text-gray-500">Down from 8</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Performance Score</p>
                    <p className="text-sm text-gray-600">Overall system performance</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-purple-600">{metrics?.performanceScore !== undefined ? metrics.performanceScore + '%' : 'N/A'}</p>
                  <p className="text-xs text-green-600">↑ 2% this week</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest system events and user actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">New user registered</p>
                  <p className="text-xs text-gray-600">sarah.johnson@company.com joined as customer</p>
                  <p className="text-xs text-gray-500 mt-1">2 minutes ago</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Ticket resolved</p>
                  <p className="text-xs text-gray-600">High priority ticket #1234 marked as resolved</p>
                  <p className="text-xs text-gray-500 mt-1">15 minutes ago</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <UserCheck className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Team assignment</p>
                  <p className="text-xs text-gray-600">Mike Chen assigned to Technical Support team</p>
                  <p className="text-xs text-gray-500 mt-1">1 hour ago</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">System alert</p>
                  <p className="text-xs text-gray-600">High ticket volume detected in billing category</p>
                  <p className="text-xs text-gray-500 mt-1">3 hours ago</p>
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
            Common administrative tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/admin/users">
              <Button variant="outline" className="w-full justify-start h-auto p-4">
                <div className="text-left">
                  <Users className="h-5 w-5 mb-2" />
                  <p className="font-medium">Manage Users</p>
                  <p className="text-xs text-gray-500">Add, edit, or remove users</p>
                </div>
              </Button>
            </Link>

            <Link href="/admin/teams">
              <Button variant="outline" className="w-full justify-start h-auto p-4">
                <div className="text-left">
                  <UserCheck className="h-5 w-5 mb-2" />
                  <p className="font-medium">Team Setup</p>
                  <p className="text-xs text-gray-500">Configure teams and roles</p>
                </div>
              </Button>
            </Link>

            <Link href="/admin/request-types">
              <Button variant="outline" className="w-full justify-start h-auto p-4">
                <div className="text-left">
                  <Settings className="h-5 w-5 mb-2" />
                  <p className="font-medium">Request Types</p>
                  <p className="text-xs text-gray-500">Manage ticket categories</p>
                </div>
              </Button>
            </Link>

            <Link href="/admin/analytics">
              <Button variant="outline" className="w-full justify-start h-auto p-4">
                <div className="text-left">
                  <BarChart3 className="h-5 w-5 mb-2" />
                  <p className="font-medium">Analytics</p>
                  <p className="text-xs text-gray-500">View detailed reports</p>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}