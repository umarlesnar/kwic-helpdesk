//components/shared/ActivityMediaDropdown.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/shared/AuthProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronUp, 
  Image, 
  Video, 
  FileText, 
  File,
  Download,
  Eye
} from 'lucide-react';
import { formatFileSize } from '@/lib/utils';
import { toast } from 'sonner';

interface ActivityMediaDropdownProps {
  activityId: string;
  className?: string;
}

export function ActivityMediaDropdown({ activityId, className = '' }: ActivityMediaDropdownProps) {
  const { token } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [media, setMedia] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCheckedMedia, setHasCheckedMedia] = useState(false);

  useEffect(() => {
    // Check for media on component mount
    checkForMedia();
  }, [activityId]);

  useEffect(() => {
    if (isExpanded && !media.length) {
      fetchActivityMedia();
    }
  }, [isExpanded, activityId]);

  const checkForMedia = async () => {
    try {
      console.log('Checking for media for activity:', activityId);
      
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
        console.log('Media check response for activity', activityId, ':', data);
        setMedia(data.media);
        setHasCheckedMedia(true);
      } else {
        console.error('Failed to check media for activity:', response.status, await response.text());
        setHasCheckedMedia(true);
      }
    } catch (error) {
      console.error('Error checking for activity media:', error);
      setHasCheckedMedia(true);
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
      }
    } catch (error) {
      console.error('Error fetching activity media:', error);
      toast.error('Failed to load media files');
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className={`${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-xs text-blue-500 hover:text-blue-700 p-1 h-auto"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="h-3 w-3 mr-1" />
            Hide attachments ({mediaCount})
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3 mr-1" />
            Show attachments ({isLoading ? '...' : mediaCount})
          </>
        )}
      </Button>

      {isExpanded && (
        <div className="mt-2 pl-4 border-l-2 border-gray-200">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          ) : media.length === 0 ? (
            <p className="text-xs text-gray-500 py-2">No attachments found</p>
          ) : (
            <div className="space-y-2">
              {media.map((mediaItem) => (
                <div key={mediaItem._id} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
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
                    <Button
                      onClick={() => handleDownload(mediaItem)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      title="View/Download"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
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