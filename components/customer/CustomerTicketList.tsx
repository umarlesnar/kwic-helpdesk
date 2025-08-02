//components/customer/CustomerTicketList.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/shared/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Clock, CheckCircle, XCircle, Ticket, Tag } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export function CustomerTicketList() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch('/api/tickets', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setTickets(data);
          setFilteredTickets(data);
        }
      } catch (error) {
        console.error('Error fetching tickets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchTickets();
    }
  }, [token]);

  useEffect(() => {
    let filtered = tickets;

    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    setFilteredTickets(filtered);
  }, [tickets, searchTerm, statusFilter]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Requests</h1>
          <p className="text-gray-600 mt-1">
            View and manage your support requests
          </p>
        </div>
        <Link href="/customer/tickets/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {tickets.length === 0 ? 'No requests yet' : 'No matching requests'}
            </h3>
            <p className="text-gray-600 mb-6">
              {tickets.length === 0 
                ? 'Create your first support request to get started.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {tickets.length === 0 && (
              <Link href="/customer/tickets/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Request
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <Card key={ticket._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(ticket.status)}
                      <h3 className="font-semibold text-gray-900">
                        <Link 
                          href={`/customer/tickets/${ticket._id}`}
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
                      <span>#{ticket.ticketNumber}</span>
                      <span>{format(new Date(ticket.createdAt), 'MMM d, yyyy h:mm a')}</span>
                      {ticket.requestType && (
                        <div className="flex items-center gap-2">
                          <Tag className="h-3 w-3" />
                          <Badge className={`${getCategoryColor(ticket.requestType.category)} border-0 text-xs`}>
                            {ticket.requestType.category}
                          </Badge>
                          <span className="text-blue-600">{ticket.requestType.name}</span>
                        </div>
                      )}
                      {ticket.assignee && (
                        <span>Assigned to {ticket.assignee.name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={`${getStatusColor(ticket.status)} border-0`}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                    <Badge className={`${getPriorityColor(ticket.priority)} border-0 text-xs`}>
                      {ticket.priority}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}