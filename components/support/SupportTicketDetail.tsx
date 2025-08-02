//components/support/SupportTicketDetail.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/shared/AuthProvider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { MediaUpload } from '@/components/shared/MediaUpload';
import { MediaGallery } from '@/components/shared/MediaGallery';
import { ActivityMediaDropdown } from '@/components/shared/ActivityMediaDropdown';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  Send,
  Edit,
  Save,
  X,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";

interface SupportTicketDetailProps {
  ticketId: string;
}

export function SupportTicketDetail({ ticketId }: SupportTicketDetailProps) {
  const [showGallery, setShowGallery] = useState(false);
  const { token, user } = useAuth();
  const router = useRouter();
  const [ticket, setTicket] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [commentMediaIds, setCommentMediaIds] = useState<string[]>([]); // Store uploaded media IDs for comments
  // Ref to hold the clearFiles function from MediaUpload
  const mediaUploadRef = useRef<{ clearFiles: () => void }>(null);


  const [editData, setEditData] = useState({
    status: "",
    priority: "",
    assigneeId: "",
  });
  const [assignees, setAssignees] = useState<any[]>([]);

  // Move fetchTicket outside useEffect so it can be called elsewhere
  const fetchTicket = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTicket(data);
        setEditData({
          status: data.status,
          priority: data.priority,
          assigneeId: data.assigneeId || "",
        });
      } else if (response.status === 404) {
        setError("Ticket not found");
      } else if (response.status === 403) {
        setError("Access denied");
      } else {
        setError("Failed to load ticket");
      }
    } catch (error) {
      console.error("Error fetching ticket:", error);
      setError("Failed to load ticket");
    } finally {
      setIsLoading(false);
    }
  }, [ticketId, token]);

  useEffect(() => {
    const fetchAssignees = async () => {
      try {
        // Fetch agents directly
        const response = await fetch('/api/users?role=agent', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setAssignees(data);
        }
      } catch (error) {
      }
    };

    if (token) {
      fetchTicket();
      fetchAssignees();
    }
  }, [token, ticketId, fetchTicket]);

  const handleAddComment = async () => {
    if (!comment.trim() && commentMediaIds.length === 0) return; // Prevent submitting empty comment without media

    setIsSubmittingComment(true);
    try {
      const response = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: comment.trim() || undefined, // Send content only if not empty
          isInternal,
          media: commentMediaIds, // Include uploaded media IDs
        }),
      });

      if (response.ok) {
        const newActivity = await response.json();
        setTicket((prev: any) => ({
          ...prev,
          activities: [...prev.activities, newActivity],
        }));
        setComment("");
        setCommentMediaIds([]);
        // Clear files in MediaUpload using the ref
        if (mediaUploadRef.current) {
          mediaUploadRef.current.clearFiles();
        }
        toast.success("Comment added successfully");
      } else {
        toast.error("Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCommentMediaUploadComplete = (mediaObj: any) => {
    setCommentMediaIds(prev => [...prev, mediaObj._id]);
  };

  // Function to handle media removal from MediaGallery
  const handleMediaGalleryRemove = (mediaId: string) => {
    setCommentMediaIds(prev => prev.filter(id => id !== mediaId));
  };

  // Function to handle removal of an uploaded file from MediaUpload list
  const handleUploadedFileRemove = (mediaId: string) => {
    setCommentMediaIds(prev => prev.filter(id => id !== mediaId));
  };

  const handleSaveChanges = async () => {
    // Convert 'unassigned' to null for API (not empty string)
    const payload = {
      ...editData,
      assigneeId:
        editData.assigneeId === 'unassigned' ? null : editData.assigneeId,
    };
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchTicket();
        setIsEditing(false);
        toast.success("Ticket updated successfully");
      } else {
        let msg = "Failed to update ticket";
        let errText = await response.text();
        try {
          const err = JSON.parse(errText);
          if (err && err.message) msg = err.message;
        } catch {
          if (errText) msg = errText;
        }
        toast.error(msg);
      }
    } catch (error) {
      console.error("Error updating ticket:", error);
      toast.error("Failed to update ticket");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
      case "in_progress":
        return <Clock className="h-4 w-4" />;
      case "resolved":
      case "closed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
          <AlertDescription>{error || "Ticket not found"}</AlertDescription>
        </Alert>
        <div className="mt-6">
          <Link href="/support/tickets">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tickets
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/support/tickets">
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
            <span>
              Created {format(new Date(ticket.createdAt), "MMM d, yyyy h:mm a")}
            </span>
            {ticket.requestType && (
              <span className="text-blue-600">{ticket.requestType.name}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSaveChanges}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
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
              <p className="text-gray-700 whitespace-pre-wrap">
                {ticket.description}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {ticket.activities?.map((activity: any) => (
                  <div key={activity._id} className="flex gap-4">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                        {activity.user?.name?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {activity.user?.name || "Unknown User"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(activity.createdAt), "MMM d, yyyy h:mm a")}
                        </span>
                        {activity.isInternal && (
                          <Badge variant="secondary" className="text-xs">
                            Internal
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-700">
                        {activity.type === "comment" ? (
                          <p className="whitespace-pre-wrap">{activity.content}</p>
                        ) : (
                          <p className="italic">{activity.content}</p>
                        )}
                      </div>
                      
                      {/* Media dropdown for this activity */}
                      <ActivityMediaDropdown 
                        activityId={activity._id}
                        activity={activity}
                        className="mt-2" 
                      />
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
                    associatedWith={{ type: 'comment', id: ticketId }}
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="internal-comment"
                      checked={isInternal}
                      onCheckedChange={setIsInternal}
                    />
                    <Label htmlFor="internal-comment" className="text-sm">
                      Internal comment (not visible to customer)
                    </Label>
                  </div>
                  <Button
                    onClick={handleAddComment}
                    disabled={(!comment.trim() && commentMediaIds.length === 0) || isSubmittingComment}
                  >
                    {isSubmittingComment ? (
                      "Adding..."
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
          {/* Ticket Properties */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Status</Label>
                {isEditing ? (
                  <Select
                    value={editData.status}
                    onValueChange={(value) =>
                      setEditData((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="waiting_for_customer">
                        Waiting for Customer
                      </SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1">
                    <Badge
                      className={`${getStatusColor(ticket.status)} border-0`}
                    >
                      {ticket.status.replace("_", " ")}
                    </Badge>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium">Priority</Label>
                {isEditing ? (
                  <Select
                    value={editData.priority}
                    onValueChange={(value) =>
                      setEditData((prev) => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1">
                    <Badge
                      className={`${getPriorityColor(
                        ticket.priority
                      )} border-0`}
                    >
                      {ticket.priority}
                    </Badge>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium">Assignee</Label>
                {isEditing ? (
                  <Select
                    value={editData.assigneeId || "unassigned"}
                    onValueChange={(value) =>
                      setEditData((prev) => ({
                        ...prev,
                        assigneeId: value || "unassigned",
                      }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {assignees.map((a) => (
                        <SelectItem key={a._id} value={a._id}>
                          {a.name}
                          {user?.id === a._id ? ' (Me)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1">
                    {ticket.assignee && ticket.assignee.name ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                            {ticket.assignee.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{ticket.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Unassigned</span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customer Details */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {ticket.customer?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{ticket.customer?.name}</p>
                  <p className="text-sm text-gray-600">
                    {ticket.customer?.email}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(ticket.createdAt), "MMM d, yyyy h:mm a")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Tag className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Request Type</p>
                  <p className="text-sm text-gray-600">
                    {ticket.requestType?.name || "Unknown"}
                  </p>
                </div>
              </div>

              {ticket.labels?.length > 0 && (
                <div className="flex items-start gap-3">
                  <Tag className="h-4 w-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium mb-2">Labels</p>
                    <div className="flex flex-wrap gap-1">
                      {ticket.labels.map((label: string) => (
                        <Badge
                          key={label}
                          variant="secondary"
                          className="text-xs"
                        >
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
