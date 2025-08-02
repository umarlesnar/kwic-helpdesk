//components/support/SupportTicketList.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/shared/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Ticket,
  User,
  Calendar,
  ArrowUpDown
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';

interface SupportTicketListProps {
  showMyTicketsOnly?: boolean;
  assigneeId?: string; // NEW: filter by assignee
}

export function SupportTicketList({ showMyTicketsOnly = false, assigneeId }: SupportTicketListProps) {
  const { token, user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const searchParams = useSearchParams();
  const [filteredTickets, setFilteredTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const params = new URLSearchParams();

        // Add assignee filter
        if (assigneeId) {
          params.append('assigneeId', assigneeId);
        } else if (showMyTicketsOnly && user?.id) {
          params.append('assigneeId', user.id);
        }

        // Add status filter from URL
        const statusQuery = searchParams.get('status');
        if (statusQuery) {
          params.append('status', statusQuery);
        }

        const url = `/api/tickets?${params.toString()}`;

        const response = await fetch(url, {
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
  }, [token, assigneeId, showMyTicketsOnly, user?.id, searchParams]);

  useEffect(() => {
    let filtered = tickets;

    // Strict filter: Only show tickets assigned to the current user in My Tickets view
    if (showMyTicketsOnly && user?.id) {
      filtered = tickets.filter(ticket =>
        ticket.assigneeId && String(ticket.assigneeId) === String(user.id)
      );
    }
    // For All Tickets, do not filter by assigneeId

    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    // Sort tickets
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                 (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
        default:
          return 0;
      }
    });

    setFilteredTickets(filtered);
  }, [tickets, searchTerm, statusFilter, priorityFilter, sortBy, showMyTicketsOnly, user?.id]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const pageTitle = showMyTicketsOnly ? 'My Tickets' : 'All Tickets';
  const pageDescription = showMyTicketsOnly 
    ? 'Tickets assigned to you' 
    : 'Manage and track all support requests';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="text-gray-600 mt-1">
            {pageDescription}
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {filteredTickets.length} of {tickets.length} tickets
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tickets, customers, or descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
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

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated">Last Updated</SelectItem>
                  <SelectItem value="created">Date Created</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {tickets.length === 0 ? 'No tickets found' : 'No matching tickets'}
            </h3>
            <p className="text-gray-600">
              {tickets.length === 0 
                ? showMyTicketsOnly 
                  ? 'No tickets are currently assigned to you.'
                  : 'All support tickets will appear here.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
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
                          href={`/support/tickets/${ticket._id}`}
                          className="hover:text-blue-600"
                        >
                          {ticket.title}
                        </Link>
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {ticket.description}
                    </p>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">#{ticket.ticketNumber}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{ticket.customer?.name}</span>
                      </div>
                      
                      {ticket.assignee && (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                              {ticket.assignee.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>Assigned to {ticket.assignee.name}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(ticket.updatedAt), 'MMM d, yyyy h:mm a')}</span>
                      </div>
                      
                      {ticket.requestType && (
                        <span className="text-blue-600">{ticket.requestType.name}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 ml-6">
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