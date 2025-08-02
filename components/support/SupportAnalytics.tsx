//components/support/SupportAnalytics.tsx
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
  Timer
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export function SupportAnalytics() {
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
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Track performance metrics and support team efficiency
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

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                <p className="text-3xl font-bold text-gray-900">
                  {metrics?.totalTickets || 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600">↑ 12%</span>
              <span className="text-gray-500 ml-2">vs previous period</span>
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
              <span className="text-green-600">↑ 3.2%</span>
              <span className="text-gray-500 ml-2">vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-3xl font-bold text-orange-600">2.4h</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600">↓ 15%</span>
              <span className="text-gray-500 ml-2">improvement</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Customer Satisfaction</p>
                <p className="text-3xl font-bold text-purple-600">4.8</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600">↑ 0.3</span>
              <span className="text-gray-500 ml-2">vs previous period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Ticket Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Ticket Status Distribution</CardTitle>
            <CardDescription>
              Breakdown of tickets by current status for {getTimeRangeLabel(timeRange)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium">Open</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{metrics?.ticketsByStatus?.open || 0}</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{
                      width: `${((metrics?.ticketsByStatus?.open || 0) / (metrics?.totalTickets || 1)) * 100}%`
                    }}>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium">In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{metrics?.ticketsByStatus?.in_progress || 0}</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{
                      width: `${((metrics?.ticketsByStatus?.in_progress || 0) / (metrics?.totalTickets || 1)) * 100}%`
                    }}>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Resolved</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{metrics?.resolvedTickets || 0}</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{
                      width: `${((metrics?.resolvedTickets || 0) / (metrics?.totalTickets || 1)) * 100}%`
                    }}>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 bg-gray-500 rounded-full"></div>
                  <span className="text-sm font-medium">Closed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{metrics?.ticketsByStatus?.closed || 0}</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-gray-500 h-2 rounded-full" style={{
                      width: `${((metrics?.ticketsByStatus?.closed || 0) / (metrics?.totalTickets || 1)) * 100}%`
                    }}>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
            <CardDescription>
              Tickets categorized by priority level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Critical</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-100 text-red-800 border-0">
                    {metrics?.ticketsByPriority?.critical || 0}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">High</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-orange-100 text-orange-800 border-0">
                    {metrics?.ticketsByPriority?.high || 0}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-100 text-yellow-800 border-0">
                    {metrics?.ticketsByPriority?.medium || 0}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Low</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800 border-0">
                    {metrics?.ticketsByPriority?.low || 0}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Response Time Trends</CardTitle>
            <CardDescription>
              Average first response time over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Average</span>
                <span className="text-2xl font-bold text-blue-600">2.4h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Target SLA</span>
                <span className="text-sm font-medium text-green-600">4h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Performance</span>
                <Badge className="bg-green-100 text-green-800 border-0">
                  40% under target
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resolution Efficiency</CardTitle>
            <CardDescription>
              Time to resolve tickets by priority
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Critical</span>
                <span className="text-sm font-medium">1.2h avg</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">High</span>
                <span className="text-sm font-medium">4.8h avg</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Medium</span>
                <span className="text-sm font-medium">12h avg</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Low</span>
                <span className="text-sm font-medium">24h avg</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
            <CardDescription>
              Support team activity and efficiency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Active Agents</span>
                </div>
                <span className="text-lg font-bold text-blue-600">8</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Tickets Resolved</span>
                </div>
                <span className="text-lg font-bold text-green-600">156</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-gray-600">Avg Handle Time</span>
                </div>
                <span className="text-lg font-bold text-purple-600">18m</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trends and Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
          <CardDescription>
            Performance trends and recommendations for {getTimeRangeLabel(timeRange)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Positive Trends</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Response time improved by 15%</p>
                    <p className="text-xs text-gray-600">Average first response is now 2.4 hours</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Customer satisfaction increased</p>
                    <p className="text-xs text-gray-600">Rating improved from 4.5 to 4.8 stars</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Resolution rate at 94.2%</p>
                    <p className="text-xs text-gray-600">Exceeding target of 90%</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Areas for Improvement</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">High priority ticket backlog</p>
                    <p className="text-xs text-gray-600">Consider additional resources for urgent issues</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Peak hour coverage</p>
                    <p className="text-xs text-gray-600">Response times slower during 2-4 PM</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Knowledge base utilization</p>
                    <p className="text-xs text-gray-600">Only 60% of tickets reference existing articles</p>
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