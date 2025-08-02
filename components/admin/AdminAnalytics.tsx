//components/admin/AdminAnalytics.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/shared/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Users,
  Calendar,
  Target,
  Activity,
  AlertTriangle,
  Timer,
  Shield,
  UserCheck,
  Ticket,
  Settings,
  Database,
  Server
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export function AdminAnalytics() {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/dashboard/metrics', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchAnalytics();
    }
  }, [token, timeRange]);

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '1d': return 'Last 24 Hours';
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      default: return 'Last 7 Days';
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Analytics</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive system performance and user analytics
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1d">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{metrics?.totalUsers ?? 0}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600">↑ {metrics?.userGrowth ?? 0}%</span>
              <span className="text-gray-500 ml-2">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Uptime</p>
                <p className="text-3xl font-bold text-green-600">{metrics?.systemUptime ?? '99.9%'}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Server className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600">↑ {metrics?.uptimeImprovement ?? '0.1%'}</span>
              <span className="text-gray-500 ml-2">improvement</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <p className="text-3xl font-bold text-orange-600">{metrics?.activeSessions ?? 0}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600">↑ {metrics?.sessionGrowth ?? 0}%</span>
              <span className="text-gray-500 ml-2">vs yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Data Storage</p>
                <p className="text-3xl font-bold text-purple-600">{metrics?.dataStorage ?? '2.4GB'}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Database className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-blue-600">↑ {metrics?.storageGrowth ?? 0}%</span>
              <span className="text-gray-500 ml-2">growth</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* User Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <CardDescription>
              Breakdown of users by role for {getTimeRangeLabel(timeRange)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Administrators</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{metrics?.userRoles?.admin ?? 0}</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${metrics?.userRolesPercent?.admin ?? 0}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Support Agents</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{metrics?.userRoles?.agent ?? 0}</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2"> 
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${metrics?.userRolesPercent?.agent ?? 0}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Customers</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{metrics?.userRoles?.customer ?? 0}</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${metrics?.userRolesPercent?.customer ?? 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Support Performance</CardTitle>
            <CardDescription>
              Key support metrics and efficiency indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Ticket className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Total Tickets</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800 border-0">
                    {metrics?.totalTickets || 0}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Resolution Rate</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800 border-0">
                    {metrics?.performanceScore !== undefined ? `${metrics.performanceScore}%` : 'N/A'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Avg Response Time</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-orange-100 text-orange-800 border-0">
                    {metrics?.avgResolutionTime ? `${metrics.avgResolutionTime}h` : 'N/A'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Target className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Customer Satisfaction</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-100 text-purple-800 border-0">
                    {metrics?.customerSatisfaction ? `${metrics.customerSatisfaction}/5` : 'N/A'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health
      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>
              Real-time system status and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">CPU Usage</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                  </div>
                  <span className="text-sm font-medium">35%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Memory Usage</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '68%' }}></div>
                  </div>
                  <span className="text-sm font-medium">68%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Disk Usage</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '42%' }}></div>
                  </div>
                  <span className="text-sm font-medium">42%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Network I/O</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                  <span className="text-sm font-medium">25%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
            <CardDescription>
              User engagement and activity patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Daily Active Users</span>
                </div>
                <span className="text-lg font-bold text-blue-600">89</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Avg Session Duration</span>
                </div>
                <span className="text-lg font-bold text-green-600">24m</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-gray-600">Page Views</span>
                </div>
                <span className="text-lg font-bold text-purple-600">1,247</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-orange-600" />
                  <span className="text-sm text-gray-600">New Registrations</span>
                </div>
                <span className="text-lg font-bold text-orange-600">12</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Overview</CardTitle>
            <CardDescription>
              Security events and system protection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Security Score</span>
                </div>
                <span className="text-lg font-bold text-green-600">98%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-gray-600">Failed Logins</span>
                </div>
                <span className="text-lg font-bold text-yellow-600">3</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Active Sessions</span>
                </div>
                <span className="text-lg font-bold text-blue-600">42</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Last Backup</span>
                </div>
                <span className="text-sm font-medium text-green-600">2h ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div> */}

      {/* Trends and Insights */}
      <Card>
        <CardHeader>
          <CardTitle>System Insights</CardTitle>
          <CardDescription>
            Key trends and recommendations for {getTimeRangeLabel(timeRange)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Performance Highlights</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">System uptime at 99.9%</p>
                    <p className="text-xs text-gray-600">Exceeding SLA requirements</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">User satisfaction improved</p>
                    <p className="text-xs text-gray-600">Customer rating increased to 4.8/5</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Security score maintained</p>
                    <p className="text-xs text-gray-600">No critical vulnerabilities detected</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Optimization Opportunities</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Memory usage trending up</p>
                    <p className="text-xs text-gray-600">Consider scaling resources during peak hours</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">User onboarding flow</p>
                    <p className="text-xs text-gray-600">24% drop-off rate in registration process</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Database optimization</p>
                    <p className="text-xs text-gray-600">Query performance could be improved</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}