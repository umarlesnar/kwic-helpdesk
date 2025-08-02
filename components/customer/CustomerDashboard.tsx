//components/customer/CustomerDashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/shared/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Ticket, Clock, CheckCircle, XCircle, Tag } from 'lucide-react';
import Link from 'next/link';
import { RequestType, Ticket as TicketType } from '@/types';
import { format } from 'date-fns';

export function CustomerDashboard() {
  const { token } = useAuth();
  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [requestTypesRes, ticketsRes] = await Promise.all([
          fetch('/api/request-types', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          }),
          fetch('/api/tickets', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          }),
        ]);

        if (requestTypesRes.ok) {
          const requestTypesData = await requestTypesRes.json();
          setRequestTypes(requestTypesData);
        }

        if (ticketsRes.ok) {
          const ticketsData = await ticketsRes.json();
          setTickets(ticketsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'resolved':
      case 'closed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Ticket className="h-4 w-4" />;
    }
  };

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
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Technical': 'bg-blue-100 text-blue-800',
      'Product': 'bg-purple-100 text-purple-800',
      'Account': 'bg-green-100 text-green-800',
      'Billing': 'bg-orange-100 text-orange-800',
      'Training': 'bg-indigo-100 text-indigo-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Group request types by category
  const requestTypesByCategory = requestTypes.reduce((acc, type) => {
    if (!type || !type.category) return acc;
    if (!acc[type.category]) {
      acc[type.category] = [];
    }
    acc[type.category].push(type);
    return acc;
  }, {} as Record<string, RequestType[]>);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-green-500 text-white rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-2">Welcome to the Help Center</h1>
        <p className="text-blue-100 mb-6">
          Get help with your questions and issues. Browse topics or create a new support request.
        </p>
        <Link href="/customer/tickets/new">
          <Button className="bg-white text-green-600 hover:bg-gray-100">
            <Plus className="h-4 w-4 mr-2" />
            Create New Request
          </Button>
        </Link>
      </div>

      {/* Recent Tickets */}
      {tickets && tickets.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Recent Requests</h2>
            <Link href="/customer/tickets">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          <div className="grid gap-4">
            {tickets.slice(0, 3).map((ticket) => (
              <Card key={ticket.id || ticket._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(ticket.status)}
                        <h3 className="font-semibold text-gray-900">
                          <Link 
                            href={`/customer/tickets/${ticket.id || ticket._id}`}
                            className="hover:text-blue-600"
                          >
                            {ticket.title}
                          </Link>
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>#{ticket.id || ticket._id}</span>
                        <span>{ticket.createdAt && !isNaN(new Date(ticket.createdAt).getTime()) ? format(new Date(ticket.createdAt), 'MMM d, yyyy') : 'N/A'}</span>
                        {ticket.requestType && ticket.requestType.category && ticket.requestType.name && (
                          <div className="flex items-center gap-2">
                            <Badge className={`${getCategoryColor(ticket.requestType.category)} border-0 text-xs`}>
                              {ticket.requestType.category}
                            </Badge>
                            <span className="text-blue-600">{ticket.requestType.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(ticket.status)} border-0`}>
                      {ticket.status ? ticket.status.replace('_', ' ') : 'N/A'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Browse Topics by Category */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse Topics</h2>
        <div className="space-y-8">
          {Object.entries(requestTypesByCategory).map(([category, types]) => (
            <div key={category}>
              <div className="flex items-center gap-3 mb-4">
                <Tag className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                <Badge className={`${getCategoryColor(category)} border-0`}>
                  {types.length} {types.length === 1 ? 'type' : 'types'}
                </Badge>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {types.map((requestType) => (
                  <Card key={requestType.id || requestType._id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <Link href={`/customer/tickets/new?type=${requestType.id || requestType._id}`}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Ticket className="h-5 w-5 text-blue-600" />
                          {requestType.name}
                        </CardTitle>
                        <CardDescription>
                          {requestType.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm">
                          <Badge className={`${getCategoryColor(requestType.category)} border-0 text-xs`}>
                            {requestType.category}
                          </Badge>
                          <Badge 
                            variant={requestType.priority === 'high' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {requestType.priority}
                          </Badge>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link href="/customer/tickets/new">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </Link>
          <Link href="/customer/tickets">
            <Button variant="outline" size="sm">
              <Ticket className="h-4 w-4 mr-2" />
              My Requests
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}