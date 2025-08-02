//components/shared/MediaGallery.tsx
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
  Download,
  Eye,
  Trash2,
  Image,
  Video,
  FileText,
  File,
  Calendar,
  User,
  MoreHorizontal
} from 'lucide-react';
import { format } from 'date-fns';
import { formatFileSize } from '@/lib/utils';
import { toast } from 'sonner';

interface MediaGalleryProps {
  associatedWith?: {
    types: ('ticket' | 'comment' | 'activity' | 'user' | 'system')[];
    id: string;
    activityIds?: string[];
  };
  onMediaSelect?: (media: any) => void;
  hideFilterAndSearch?: boolean;
  onMediaRemoved?: (mediaId: string) => void; // New prop for removal callback
  selectable?: boolean;
  className?: string;
}

export function MediaGallery({
  associatedWith,
  onMediaSelect,
  onMediaRemoved,
  hideFilterAndSearch = false,
  selectable = false,
  className = ''
}: MediaGalleryProps) {
  const { token, user } = useAuth();
  const [media, setMedia] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchMedia();
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(timeoutId);
  }, [associatedWith, searchTerm, categoryFilter, sortBy, sortOrder, page]);

  const fetchMedia = async () => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy,
        sortOrder
      });

      if (associatedWith) {
        associatedWith.types.forEach(type => {
          params.append('associatedTypes', type);
        });

        // send ticketId
        params.append('associatedIds', associatedWith.id);

        // send all activityIds (if any)
        (associatedWith.activityIds || []).forEach(id => {
          params.append('associatedIds', id);
        });
      }



      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }

      const response = await fetch(`/api/media/list?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMedia(data.media);
        setPagination(data.pagination);
      } else {
        toast.error('Failed to load media files');
      }
    } catch (error) {
      console.error('Error fetching media:', error);
      toast.error('Failed to load media files');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [associatedWith?.id, searchTerm, categoryFilter]);


  const handleDownload = async (mediaItem: any) => {
    // Direct download for public files, use API for private (though all will be public now)
    if (mediaItem.isPublic && mediaItem.url) {
      window.open(mediaItem.url, '_blank');
    } else {
      try {
        const response = await fetch(`/api/media/${mediaItem._id}?download=true`, {
          headers: {
            'Authorization': `Bearer ${token}` // Still need auth for the API route
          }
        });

        if (response.ok) {
          const data = await response.json();
          window.open(data.media.downloadUrl, '_blank');
        } else {
          toast.error('Failed to generate download link');
        }
      } catch (error) {
        console.error('Error downloading media:', error);
        toast.error('Failed to download file');
      }
    }
  };

  const handleDelete = async (mediaItem: any) => {
    if (!confirm(`Are you sure you want to delete ${mediaItem.originalName}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/media/${mediaItem.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Remove from local state
        setMedia(prev => prev.filter(m => m._id !== mediaItem._id));
        // Call the parent callback
        onMediaRemoved?.(mediaItem._id);
        toast.success('File deleted successfully');
      } else {
        toast.error('Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      toast.error('Failed to delete file');
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-5 w-5 text-blue-600" />;
    if (mimeType.startsWith('video/')) return <Video className="h-5 w-5 text-purple-600" />;
    if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText className="h-5 w-5 text-red-600" />;
    return <File className="h-5 w-5 text-gray-600" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getVirusScanColor = (status: string) => {
    switch (status) {
      case 'clean':
        return 'bg-green-100 text-green-800';
      case 'infected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
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
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filters */}
      {!hideFilterAndSearch && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="image">Images</SelectItem>
                    <SelectItem value="video">Videos</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="document">Documents</SelectItem>
                    <SelectItem value="text">Text Files</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Date Created</SelectItem>
                    <SelectItem value="filename">Name</SelectItem>
                    <SelectItem value="size">Size</SelectItem>
                    <SelectItem value="downloadCount">Downloads</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descending</SelectItem>
                    <SelectItem value="asc">Ascending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Media Grid */}
      {media.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No files found</h3>
            <p className="text-gray-600">
              {searchTerm || categoryFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : associatedWith?.types.includes('ticket') ? 'No files attached to this ticket yet.'
                  : associatedWith?.types.includes('comment') ? 'No files attached to this comment yet.'
                    : associatedWith?.types.includes('activity') ? 'No files attached to this activity yet.'
                      : associatedWith?.types.includes('user') ? 'No files attached to this user yet.'
                        : associatedWith?.types.includes('system') ? 'No files attached to this system yet.'
                          : 'No files found. Upload a file to get started.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {media.map((mediaItem) => (
            <Card
              key={mediaItem._id} // Use _id for key
              className={`hover:shadow-md transition-shadow ${selectable ? 'cursor-pointer hover:border-blue-500' : ''
                }`}
              onClick={() => selectable && onMediaSelect?.(mediaItem)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 overflow-ellipsis line-clamp-1">
                    {getFileIcon(mediaItem.mimeType)}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm truncate " title={mediaItem.originalName}>
                        {mediaItem.originalName}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(mediaItem.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(mediaItem);
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {(user?.role === 'admin' || mediaItem.uploadedBy.id === user?.id) && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(mediaItem);
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>


                {/* Thumbnail for images with fallback and placeholder */}
                {mediaItem.mimeType.startsWith('image/') && (
                  <div className="mb-3">
                    {mediaItem.thumbnailUrl ? (
                      <img
                        src={mediaItem.thumbnailUrl}
                        alt={mediaItem.originalName}
                        className="w-full h-32 object-cover rounded border"
                        onError={e => { (e.target as HTMLImageElement).src = mediaItem.url || ''; }}
                      />
                    ) : mediaItem.url ? (
                      <img
                        src={mediaItem.url}
                        alt={mediaItem.originalName}
                        className="w-full h-32 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-full h-32 flex items-center justify-center bg-gray-100 text-gray-400 border rounded">
                        <Image className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                )}

                {/* Status Badges */}
                <div className="flex flex-wrap gap-1 mb-1">
                  <Badge className={`${getVirusScanColor(mediaItem.virusScanStatus)} border-0 text-xs`}>
                    {mediaItem.virusScanStatus}
                  </Badge>
                </div>

                {/* Metadata */}
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    {/* Check if uploadedBy exists before accessing name and _id */}
                    <User className="h-3 w-3" />
                    <span>{mediaItem.uploadedBy?.name || 'Unknown User'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(mediaItem.createdAt), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} files
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => setPage(page - 1)}
              disabled={!pagination.hasPrev}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            <Button
              onClick={() => setPage(page + 1)}
              disabled={!pagination.hasNext}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}