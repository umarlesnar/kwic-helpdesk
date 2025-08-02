//components/customer/CreateTicketForm.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/shared/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ObjectId } from 'bson';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Tag } from 'lucide-react';
import Link from 'next/link';
import { RequestType } from '@/types';
import { toast } from 'sonner';
import { MediaUpload, MediaUploadRef } from '@/components/shared/MediaUpload';

export function CreateTicketForm() {
  const { token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedTypeId = searchParams.get('type');

  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requestTypeId: selectedTypeId || '',
    priority: 'medium',
  });
  const [mediaIds, setMediaIds] = useState<string[]>([]); // Store uploaded media IDs
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempTicketId] = useState(() => new ObjectId().toString());

  // Ref to call the clearFiles method in MediaUpload
  const mediaUploadRef = useRef<MediaUploadRef>(null);

  useEffect(() => {
    const fetchRequestTypes = async () => {
      try {
        const response = await fetch('/api/request-types', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setRequestTypes(data);
        }
      } catch (error) {
        console.error('Error fetching request types:', error);
      }
    };

    if (token) {
      fetchRequestTypes();
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
  
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          media: mediaIds,
        }),
      });
  
      if (response.ok) {
        const ticket = await response.json();
        toast.success('Request created successfully!', {
          style: {
            background: '#4ac959',
            color: '#ffffff',
            border: '#4ac959',
          },
          className: 'success-toast',
          duration: 4000,
        });

        // Clear local state & upload list
        setMediaIds([]);
        mediaUploadRef.current?.clearFiles();

        // Navigate to the new ticket
        router.push(`/customer/tickets/${ticket._id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create request');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      setError('Failed to create request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMediaUploadComplete = (mediaObj: any) => {
    setMediaIds(prev => [...prev, mediaObj.id]);
  };

  // Always normalize SLA for all request types before rendering
  const normalizedRequestTypes = requestTypes.map((type: any) => ({
    ...type,
    sla: typeof type.sla === 'object' ? type.sla?.responseTime || 24 : type.sla,
  }));

  const selectedRequestType = normalizedRequestTypes.find(
    (type) => type._id === formData.requestTypeId
  );

  // Group request types by category
  const requestTypesByCategory: Record<string, RequestType[]> = requestTypes.reduce((acc, type) => {
    if (!acc[type.category]) {
      acc[type.category] = [];
    }
    acc[type.category].push(type);
    return acc;
  }, {} as Record<string, RequestType[]>);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className='absolute'>
        <Link href="/customer">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>
      <div className="items-center gap-4">
        <div className='text-center'>
          <h1 className="text-3xl font-bold text-gray-900">Create New Request</h1>
          <p className="text-gray-600 mt-1">
            Describe your issue or question in detail
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Request Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Request Type</CardTitle>
            <CardDescription>
              Select the category that best describes your request
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="requestType">Category *</Label>
              <Select
                value={formData.requestTypeId}
                onValueChange={(value) => handleChange('requestTypeId', value)}
                required
              >
                <SelectTrigger className='py-9'>
                  <SelectValue placeholder="Select a request type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(requestTypesByCategory).map(([category, types]) => (
                    <div key={category}>
                      <div className="px-2 py-1.5 text-sm font-semibold text-gray-900 bg-gray-100">
                        {category}
                      </div>
                      {types.map((type: any) => (
                        <SelectItem key={type._id} value={String(type._id)}>
                          <div className="flex flex-col py-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{type.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {type.category}
                              </Badge>
                            </div>
                            <span className=" pr-4 text-sm text-gray-500">{type.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRequestType && (
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Tag className="h-4 w-4 text-green-600" />
                      <p className="font-medium text-green-900">{selectedRequestType.name}</p>
                      <Badge className="bg-green-100 text-green-800 border-0">
                        {selectedRequestType.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-green-700">{selectedRequestType.description}</p>
                  </div>
                  <div className="text-right text-sm text-green-600">
                    <p>Priority: {selectedRequestType.priority}</p>
                    <p>SLA: {selectedRequestType?.sla} hours</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Request Details */}
        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
            <CardDescription>
              Provide a clear title and detailed description of your request
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                className='border-gray-300  ring-non'
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Brief description of your request"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Provide detailed information about your request..."
                rows={8}
                required
              />
              <p className="text-sm text-gray-500">
                Include as much detail as possible to help us assist you quickly.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - General inquiry</SelectItem>
                  <SelectItem value="medium">Medium - Standard request</SelectItem>
                  <SelectItem value="high">High - Urgent issue</SelectItem>
                  <SelectItem value="critical">Critical - System down</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>


        {/* Media Upload */}
        <div className="space-y-2">
          <Label>Attach Media Files</Label>
          <MediaUpload
            associatedWith={{ type: 'ticket', id: tempTicketId }}
            onUploadComplete={handleMediaUploadComplete}
            onUploadError={err => toast.error(err)}
            ref={mediaUploadRef} 
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Link href="/customer">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              'Creating...'
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Create Request
              </>
            )}
          </Button>
        </div>
      </form>

 

    </div>
  );
}