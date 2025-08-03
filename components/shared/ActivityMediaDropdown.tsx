//components/shared/ActivityMediaDropdown.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/shared/AuthProvider';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  ChevronUp,
  Image,
  Video,
  FileText,
  File,
  Eye} from 'lucide-react';
import { formatFileSize } from '@/lib/utils';
import { toast } from 'sonner';

interface ActivityMediaDropdownProps {
  activityId: string;
  activity?: any; // Pass the activity object to check attachments
  className?: string;
  onMediaDeleted?: () => void; // New prop to handle media deletion
}

export function ActivityMediaDropdown({
  activityId,
  activity,
  className = '',
  onMediaDeleted
}: ActivityMediaDropdownProps) {
  const { token } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [media, setMedia] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCheckedMedia, setHasCheckedMedia] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const checkForMedia = async () => {
    try {
      const params = new URLSearchParams({
        associatedTypes: 'activity',
        associatedId: activityId,
        limit: '1' // Just check if any exists
      });

      const response = await fetch(`/api/media/list?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMedia(data.media);
        setHasCheckedMedia(true);
      } else {
        setHasCheckedMedia(true);
        setMedia([]);
      }
    } catch (error) {
      console.error('Error checking for activity media:', error);
      setHasCheckedMedia(true);
      setMedia([]);
    }
  };

  const fetchActivityMedia = async () => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams({
        associatedTypes: 'activity',
        associatedId: activityId,
        limit: '50'
      });

      const response = await fetch(`/api/media/list?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMedia(data.media);
      } else {
        toast.error('Failed to load media files');
        setMedia([]);
      }
    } catch (error) {
      console.error('Error fetching activity media:', error);
      toast.error('Failed to load media files');
      setMedia([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshMedia = async () => {
    if (activity?.attachments?.length > 0) {
      // If activity has attachments, use them directly
      setMedia(activity.attachments.map((att: { filename: any; }) => ({
        _id: `${activityId}-${att.filename}`, // Create a unique ID
        ...att
      })));
      setHasCheckedMedia(true);
    } else {
      // Otherwise check via API
      await checkForMedia();
    }
  };

  useEffect(() => {
    refreshMedia();
  }, [activity]);

  useEffect(() => {
    refreshMedia();
  }, [activityId, activity]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isExpanded) {
      fetchActivityMedia();
    }
  }, [isExpanded, activityId]);

  useEffect(() => {
    if (onMediaDeleted) {
      // If parent component notifies about media deletion, refresh
      refreshMedia();
    }
  }, [onMediaDeleted]);

  const handleDownload = async (mediaItem: any) => {
    if (mediaItem.isPublic && mediaItem.url) {
      window.open(mediaItem.url, '_blank');
    } else {
      try {
        const response = await fetch(`/api/media/${mediaItem._id}?download=true`, {
          headers: {
            'Authorization': `Bearer ${token}`
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

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4 text-blue-600" />;
    if (mimeType.startsWith('video/')) return <Video className="h-4 w-4 text-purple-600" />;
    if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText className="h-4 w-4 text-red-600" />;
    return <File className="h-4 w-4 text-gray-600" />;
  };

  // Don't render anything if no media is found after checking
  if (!hasCheckedMedia || media.length === 0) {
    return null;
  }

  // Show loading state or media count
  const mediaCount = media.length;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-green-500 hover:text-green-700 p-1 h-auto"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Hide attachments ({mediaCount})
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Attachments ({isLoading ? '...' : mediaCount})
            </>
          )}
        </Button>
      </div>

      {isExpanded && (
        <div className="absolute left-0 mt-1 w-56 z-80 bg-white shadow-lg rounded-md border border-gray-200">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
            </div>
          ) : media.length === 0 ? (
            <p className="text-xs text-gray-500 py-2">No attachments found</p>
          ) : (
            <div className="space-y-0">
              {media.map((mediaItem, index) => (
                <div key={mediaItem._id || index} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getFileIcon(mediaItem.mimeType)}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate" title={mediaItem.originalName}>
                        {mediaItem.originalName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(mediaItem.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {mediaItem.url && (
                      <Button
                        onClick={() => window.open(mediaItem.url, '_blank')}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        title="View/Download"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}