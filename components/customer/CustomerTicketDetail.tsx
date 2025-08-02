//components/customer/CustomerTicketDetail.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/shared/AuthProvider';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
  User,
  Calendar,
  Tag,
  AlertTriangle,
  Send
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { MediaUpload, MediaUploadRef } from '@/components/shared/MediaUpload';
import { MediaGallery } from '@/components/shared/MediaGallery';
import { ActivityMediaDropdown } from '@/components/shared/ActivityMediaDropdown';

interface CustomerTicketDetailProps {
  ticketId: string;
}

export function CustomerTicketDetail({ ticketId }: CustomerTicketDetailProps) {
  const [showGallery, setShowGallery] = useState(false);
  const { token } = useAuth();
  const router = useRouter();
  const [ticket, setTicket] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [error, setError] = useState('');
  const [commentMediaIds, setCommentMediaIds] = useState<string[]>([]); // Store uploaded media IDs for comments

  // Ref to hold the clearFiles function from MediaUpload
  const mediaUploadRef = useRef<MediaUploadRef>(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const response = await fetch(`/api/tickets/${ticketId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setTicket(data);
        } else if (response.status === 404) {
          setError('Request not found');
        } else if (response.status === 403) {
          setError('Access denied');
        } else {
          setError('Failed to load request');
        }
      } catch (error) {
        console.error('Error fetching ticket:', error);
        setError('Failed to load request');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchTicket();
    }
  }, [token, ticketId]);

  const handleAddComment = async () => {
    if (!comment.trim() && commentMediaIds.length === 0) return; // Prevent submitting empty comment without media

    setIsSubmittingComment(true);
    try {
      const response = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: comment.trim() || undefined, // Send content only if not empty
          isInternal: false,
          media: commentMediaIds, // Include uploaded media IDs
        }),
      });

      if (response.ok) {
        const newActivity = await response.json();
        setTicket((prev: any) => ({
          ...prev,
          activities: [...prev.activities, newActivity],
        }));
        setComment('');
        setCommentMediaIds([]); // Clear uploaded media IDs after submission
        // Clear files in MediaUpload using the ref
        if (mediaUploadRef.current) {
          mediaUploadRef.current.clearFiles();
        }
        toast.success('Comment added successfully');
      } else {
        toast.error('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCommentMediaUploadComplete = (mediaObj: any) => {
    setCommentMediaIds(prev => [...prev, mediaObj.id]);
  };

  // Function to handle media removal from MediaGallery
  const handleMediaGalleryRemove = (mediaId: string) => {
    setCommentMediaIds(prev => prev.filter(id => id !== mediaId));
  };

  // Function to handle removal of an uploaded file from MediaUpload list
  const handleUploadedFileRemove = (mediaId: string) => {
    setCommentMediaIds(prev => prev.filter(id => id !== mediaId));
  };

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === 'cancelled') {
      setPendingStatus(newStatus);
      setShowCancelConfirm(true);
      return;
    }
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updatedTicket = await response.json();
        setTicket((prev: any) => ({ ...prev, ...updatedTicket }));
        toast.success('Status updated successfully');
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
    }
  };

  const handleCancelConfirm = async (confirm: boolean) => {
    setShowCancelConfirm(false);
    if (confirm && pendingStatus) {
      await handleStatusChangeDirect(pendingStatus);
    }
    setPendingStatus(null);
  };

  const handleStatusChangeDirect = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updatedTicket = await response.json();
        setTicket((prev: any) => ({ ...prev, ...updatedTicket }));
        toast.success('Status updated successfully');
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

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
        return <Clock className="h-4 w-4" />;
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

  if (error || !ticket) {
    return (
      <div className="max-w-2xl mx-auto">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Request not found'}
          </AlertDescription>
        </Alert>
        <div className="mt-6">
          <Link href="/customer/tickets">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Requests
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Cancel Confirmation Message */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-2">Cancel Request</h2>
            <p className="mb-4 text-gray-800">Are you sure you want to cancel this request? This action cannot be undone.</p>
            <div className="flex justify-between gap-2">
              <Button className='border-2 border-gray-400' variant="outline" onClick={() => handleCancelConfirm(false)}>
                No, Go Back
              </Button>
              <Button variant="destructive" onClick={() => handleCancelConfirm(true)}>
                Yes, Cancel Request
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/customer/tickets">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {getStatusIcon(ticket.status)}
            <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>#{ticket.ticketNumber}</span>
            <span>Created {format(new Date(ticket.createdAt), 'MMM d, yyyy h:mm a')}</span>
            {ticket.requestType && (
              <div className="flex items-center gap-2">
                <Badge className={`${getCategoryColor(ticket.requestType.category)} border-0 text-xs`}>
                  {ticket.requestType.category}
                </Badge>
                <span className="text-blue-600">{ticket.requestType.name}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${getStatusColor(ticket.status)} border-0`}>
            {ticket.status.replace('_', ' ')}
          </Badge>
          <Badge className={`${getPriorityColor(ticket.priority)} border-0`}>
            {ticket.priority}
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {ticket.activities?.map((activity: any) => (
                  <div key={activity.id} className="flex gap-4 relative">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                        {activity.user?.name?.charAt(0).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      {/* Header row */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {activity.user?.name || 'Unknown User'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(activity.createdAt), 'MMM d, yyyy h:mm a')}
                        </span>
                        {activity.isInternal && (
                          <Badge variant="secondary" className="text-xs">
                            Internal
                          </Badge>
                        )}
                        {/* Dropdown button positioned absolutely */}
                        <div className="absolute right-0 top-0 z-10">
                          <ActivityMediaDropdown
                            activityId={activity._id || activity.id}
                            activity={activity}
                          />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="text-sm text-gray-700">
                        {activity.type === 'comment' ? (
                          <p className="whitespace-pre-wrap">{activity.content}</p>
                        ) : (
                          <p className="italic">{activity.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Add Comment */}
          <Card>
            <CardHeader>
              <CardTitle>Add Comment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={4}
                />
                {/* Media Upload & Gallery for comments */}
                <div className="space-y-2">
                  <label className="font-medium">Attach Media Files</label>
                  <MediaUpload
                    associatedWith={{ type: 'ticket', id: ticketId }}
                    onUploadComplete={handleCommentMediaUploadComplete}
                    onUploadError={err => toast.error(err || 'Upload failed')}
                    ref={mediaUploadRef}
                    onUploadedFileRemoved={(mediaId) => {
                      setCommentMediaIds((prev: string[]) => prev.filter((id: string) => id !== mediaId));
                    }}
                  />

                  <MediaGallery
                    associatedWith={{ types: ['ticket', 'comment'], id: ticketId }}
                    onMediaSelect={mediaObj => setCommentMediaIds(prev => [...prev, mediaObj._id])} // Allow selecting existing media
                    onMediaRemoved={handleMediaGalleryRemove} // Pass the removal callback
                    selectable
                    className="mt-4"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleAddComment}
                    disabled={(!comment.trim() && commentMediaIds.length === 0) || isSubmittingComment}
                  >
                    {isSubmittingComment ? (
                      'Adding...'
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Add Comment
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Actions */}
          {ticket.status === 'resolved' && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => handleStatusChange('closed')}
                  className="w-full"
                  variant="outline"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Closed
                </Button>
                <Button
                  onClick={() => handleStatusChange('reopened')}
                  className="w-full"
                  variant="outline"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Reopen Request
                </Button>
              </CardContent>
            </Card>
          )}

          {(ticket.status === 'open' || ticket.status === 'in_progress') && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => handleStatusChange('cancelled')}
                  className="w-full"
                  variant="outline"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Request
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Request Details */}
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Customer</p>
                  <p className="text-sm text-gray-600">{ticket.customer?.name}</p>
                </div>
              </div>

              {ticket.assignee && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Assigned To</p>
                    <p className="text-sm text-gray-600">{ticket.assignee.name}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(ticket.createdAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Tag className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Category</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${getCategoryColor(ticket.requestType.category)} border-0 text-xs`}>
                      {ticket.requestType.category}
                    </Badge>
                    <span className="text-sm text-gray-600">{ticket.requestType.name}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Tag className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Priority</p>
                  <Badge className={`${getPriorityColor(ticket.priority)} border-0 text-xs`}>
                    {ticket.priority}
                  </Badge>
                </div>
              </div>

              {ticket.labels?.length > 0 && (
                <div className="flex items-start gap-3">
                  <Tag className="h-4 w-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium mb-2">Labels</p>
                    <div className="flex flex-wrap gap-1">
                      {ticket.labels.map((label: string) => (
                        <Badge key={label} variant="secondary" className="text-xs">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}