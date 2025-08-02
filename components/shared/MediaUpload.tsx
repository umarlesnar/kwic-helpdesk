//components/shared/MediaUpload.tsx
'use client';

import React, { forwardRef, useState, useCallback, useImperativeHandle } from 'react';
import { useAuth } from '@/components/shared/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  File, 
  Image, 
  Video, 
  FileText, 
  X, 
  AlertCircle,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { formatFileSize } from '@/lib/utils';

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  mediaId?: string;
  uploadUrl?: string;
  s3Key?: string;
  isPublic: boolean;
}

export interface MediaUploadRef {
  clearFiles: () => void;
}

interface MediaUploadProps {
  associatedWith: {
    type: 'ticket' | 'user' | 'comment' | 'system';
    id: string;
  };
  onUploadComplete?: (media: any) => void;
  onUploadError?: (error: string) => void;
  onUploadedFileRemoved?: (mediaId: string) => void;
  maxFiles?: number;
  maxFileSize?: number;
  allowedTypes?: string[];
  className?: string;
}

export const MediaUpload = forwardRef<MediaUploadRef, MediaUploadProps>((
  {
    associatedWith,
    onUploadComplete,
    onUploadError,
    onUploadedFileRemoved,
    maxFiles = 10,
    maxFileSize = 100 * 1024 * 1024,
    allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/csv'
    ],
    className = ''
  },
  ref
) => {
  const { token, user } = useAuth();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  useImperativeHandle(ref, () => ({
    clearFiles: () => {
      setFiles([]);
    }
  }));

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (mimeType.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size exceeds ${formatFileSize(maxFileSize)}`;
    }
    if (!allowedTypes.includes(file.type)) {
      return `File type ${file.type} is not allowed`;
    }
    return null;
  };

  const uploadFile = async (uploadFile: UploadFile) => {
    try {
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      ));

      const uploadResponse = await fetch('/api/media/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          filename: uploadFile.file.name,
          contentType: uploadFile.file.type,
          size: uploadFile.file.size,
          associatedWith,
          tags: [],
          isPublic: true
        })
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json().catch(() => ({}));
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'error', error: error.error || 'Failed to get upload URL' }
            : f
        ));
        toast.error(`Failed to get upload URL for ${uploadFile.file.name}: ${error.error || 'Unknown error'}`);
        onUploadError?.(error.error || 'Failed to get upload URL');
        return;
      }

      const { uploadUrl, s3Key } = await uploadResponse.json();

      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, uploadUrl, s3Key, progress: 10 }
          : f
      ));

      const s3Response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': uploadFile.file.type,
          'Content-Length': uploadFile.file.size.toString()
        },
        body: uploadFile.file
      });

      if (!s3Response.ok) {
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'error', error: `S3 upload failed: ${s3Response.statusText}` }
            : f
        ));
        toast.error(`S3 upload failed for ${uploadFile.file.name}: ${s3Response.statusText}`);
        onUploadError?.(`S3 upload failed: ${s3Response.statusText}`);
        return;
      }

      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'processing', progress: 80 }
          : f
      ));

      const confirmResponse = await fetch('/api/media/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          s3Key,
          actualSize: uploadFile.file.size,
          filename: uploadFile.file.name,
          originalName: uploadFile.file.name,
          mimeType: uploadFile.file.type,
          uploadedBy: user?.id,
          associatedWith,
          tags: [],
          isPublic: true,
          expiresAt: undefined,
          metadata: {}
        })
      });

      if (!confirmResponse.ok) {
        const error = await confirmResponse.json().catch(() => ({}));
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'error', error: error.error || 'Failed to confirm upload' }
            : f
        ));
        toast.error(`Failed to confirm upload for ${uploadFile.file.name}: ${error.error || 'Unknown error'}`);
        onUploadError?.(error.error || 'Failed to confirm upload');
        return;
      }

      const { media } = await confirmResponse.json();

      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'completed', progress: 100, mediaId: media.id }
          : f
      ));

      toast.success(`${uploadFile.file.name} uploaded successfully`);
      onUploadComplete?.(media);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'error', error: errorMessage }
          : f
      ));
      toast.error(`Failed to upload ${uploadFile.file.name}: ${errorMessage}`);
      onUploadError?.(errorMessage);
    }
  };

  const handleFileSelect = useCallback(async (selectedFiles: FileList) => {
    const newFiles: UploadFile[] = [];
    
    for (let i = 0; i < selectedFiles.length && files.length + newFiles.length < maxFiles; i++) {
      const file = selectedFiles[i];
      const error = validateFile(file);
      
      if (error) {
        toast.error(`${file.name}: ${error}`);
        continue;
      }

      const uploadFileEntry: UploadFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        progress: 0,
        status: 'pending',
        isPublic: true
      };

      newFiles.push(uploadFileEntry);
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
      newFiles.forEach(file => uploadFile(file));
    }
  }, [files.length, maxFiles, maxFileSize, allowedTypes, token, user, associatedWith, onUploadComplete, onUploadError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleRemove = async (mediaId?: string) => {
    if (!mediaId) {
      toast.error('Cannot delete file before it is uploaded.');
      return;
    }
    if (!confirm("Are you sure you want to remove this file?")) return;
    try {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        onUploadedFileRemoved?.(mediaId);
        setFiles((prev: UploadFile[]) =>
          prev.filter(f => f.mediaId !== mediaId)
        );
        toast.success('File removed successfully');
      } else {
        toast.error('Failed to remove file');
      }
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Error removing file');
    }
  };
  
  
  
  

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardContent className="p-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Drop files here or click to browse
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Maximum {maxFiles} files, up to {formatFileSize(maxFileSize)} each
            </p>
            <input
              type="file"
              multiple
              accept={allowedTypes.join(',')}
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              className="hidden"
              id="file-input"
            />
            <Button asChild variant="outline">
              <label htmlFor="file-input" className="cursor-pointer">
                Select Files
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Pending/Uploaded Files ({files.length})</h4>
            </div>

            <div className="space-y-3">
              {files.map((uploadFile) => (
                <div key={uploadFile.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getFileIcon(uploadFile.file.type)}
                      <div>
                        <p className="font-medium text-sm">{uploadFile.file.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(uploadFile.file.size)} • {uploadFile.file.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {uploadFile.status === 'error' && (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      {uploadFile.status !== 'completed' && uploadFile.status !== 'error' && (
                        <span className="text-xs text-gray-500">{uploadFile.status}...</span>
                      )}
                      <Button
                        onClick={() => handleRemove(uploadFile.mediaId)}
                        variant="ghost"
                        size="sm"
                        disabled={uploadFile.status === 'uploading' || uploadFile.status === 'processing'}
                      >
                        <X className="h-5 w-5 text-red-600" />
                      </Button>
                    </div>
                  </div>

                  {(uploadFile.status === 'uploading' || uploadFile.status === 'processing') && (
                    <div className="mb-3">
                      <Progress value={uploadFile.progress} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">
                        {uploadFile.status === 'uploading' ? 'Uploading...' : 'Processing...'}
                      </p>
                    </div>
                  )}

                  {uploadFile.status === 'error' && uploadFile.error && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {uploadFile.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

MediaUpload.displayName = 'MediaUpload';