//components/admin/RequestTypeManagement.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/shared/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Tag, 
  Edit, 
  Trash2, 
  Clock,
  AlertTriangle,
  CheckCircle,
  MoreHorizontal,
  Search
} from 'lucide-react';
import { toast } from 'sonner';

export function RequestTypeManagement() {
  const { token } = useAuth();
  const [requestTypes, setRequestTypes] = useState<any[]>([]);
  const [filteredTypes, setFilteredTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRequestType, setNewRequestType] = useState({
    name: '',
    description: '',
    category: '',
    priority: 'medium',
    sla: 24,
    isActive: true,
  });
  // Edit dialog state and handler
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteRequestTypeId, setDeleteRequestTypeId] = useState<string | null>(null);
  const [editRequestType, setEditRequestType] = useState<any | null>(null);

  useEffect(() => {
    if (!token) return;
    const fetchRequestTypes = async () => {
      try {
        const res = await fetch('/api/request-types', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error('Failed to fetch request types');
        const data = await res.json();
        // Fix: flatten SLA for UI consumption
        const requestTypesWithFlatSla = data.map((type: any) => ({
          ...type,
          sla: type.sla?.responseTime || 24,
        }));
        setRequestTypes(requestTypesWithFlatSla);
        setFilteredTypes(requestTypesWithFlatSla);
      } catch (error) {
        console.error('Error fetching request types:', error);
        toast.error('Failed to fetch request types');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequestTypes();
  }, [token]);

  useEffect(() => {
    let filtered = requestTypes;
    if (searchTerm) {
      filtered = filtered.filter(type =>
        type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(type => type.category === categoryFilter);
    }
    setFilteredTypes(filtered);
  }, [requestTypes, searchTerm, categoryFilter]);

  const handleCreateRequestType = async () => {
    try {
      const res = await fetch('/api/request-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newRequestType),
      });
      if (!res.ok) throw new Error('Failed to create request type');
      const createdType = await res.json();
      // Flatten SLA for UI
      const normalizedType = {
        ...createdType,
        sla: createdType.sla?.responseTime || 24,
      };
      setRequestTypes(prev => [...prev, normalizedType]);
      setNewRequestType({
        name: '',
        description: '',
        category: '',
        priority: 'medium',
        sla: 24,
        isActive: true,
      });
      setIsCreateDialogOpen(false);
      toast.success('Request type created successfully');
    } catch (error) {
      console.error('Error creating request type:', error);
      toast.error('Failed to create request type');
    }
  };

  const handleUpdateRequestType = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/request-types/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updates), // send updates directly
      });
      if (!res.ok) throw new Error('Failed to update request type');
      const updatedType = await res.json();
      // Flatten SLA for UI
      const normalizedType = {
        ...updatedType,
        sla: updatedType.sla?.responseTime || 24,
      };
      setRequestTypes(prev => prev.map(t => (t._id === id ? normalizedType : t)));
      toast.success('Request type updated successfully');
    } catch (error) {
      console.error('Error updating request type:', error);
      toast.error('Failed to update request type');
    }
  };

  // Fix DELETE handler: do not send body, only headers
  const handleDeleteRequestType = async (id: string) => {
    try {
      const res = await fetch(`/api/request-types/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error('Failed to delete request type');
      setRequestTypes(prev => prev.filter(t => t._id !== id));
      toast.success('Request type deleted successfully');
      setDeleteRequestTypeId(null);
    } catch (error) {
      console.error('Error deleting request type:', error);
      toast.error('Failed to delete request type');
    }
  };

  const toggleRequestTypeStatus = async (id: string) => {
    try {
      const type = requestTypes.find(t => t._id === id);
      if (!type) return;
      await handleUpdateRequestType(id, { isActive: !type.isActive });
    } catch (error) {
      console.error('Error updating request type status:', error);
      toast.error('Failed to update request type status');
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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <Clock className="h-4 w-4" />;
      case 'low':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const categories = Array.from(new Set(requestTypes.map(type => type.category)));
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleEditInputChange = (field: string, value: any) => {
    setEditRequestType((prev: any) => ({ ...prev, [field]: value }));
  };

  function openEditDialog(type: any): void {
    throw new Error('Function not implemented.');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Request Types</h1>
          <p className="text-gray-600 mt-1">
            Manage ticket categories, priorities, and SLA requirements
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className='bg-[#4ac959] hover:bg-[#4ac959]'>
              <Plus className="h-4 w-4 mr-2" />
              Add Request Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Request Type</DialogTitle>
              <DialogDescription>
                Define a new category for support requests with appropriate SLA and priority.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newRequestType.name}
                  onChange={(e) => setNewRequestType(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Bug Report"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newRequestType.description}
                  onChange={(e) => setNewRequestType(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this request type covers"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={newRequestType.category}
                  onChange={(e) => setNewRequestType(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., Technical, Billing, Account"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newRequestType.priority}
                    onValueChange={(value) => setNewRequestType(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sla">SLA (hours)</Label>
                  <Input
                    id="sla"
                    type="number"
                    value={newRequestType.sla}
                    onChange={(e) => setNewRequestType(prev => ({ ...prev, sla: parseInt(e.target.value) }))}
                    min="1"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                className=''
                  id="active"
                  checked={newRequestType.isActive}
                  onCheckedChange={(checked) => setNewRequestType(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="active">Active</Label>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className='bg-[#4ac959] hover:bg-[#4ac959]' onClick={handleCreateRequestType}>
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Types</p>
                <p className="text-3xl font-bold text-gray-900">{requestTypes.length}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Tag className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Types</p>
                <p className="text-3xl font-bold text-green-600">
                  {requestTypes.filter(type => type.isActive).length}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-3xl font-bold text-purple-600">{Array.from(new Set(requestTypes.map(type => type.category))).length}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Tag className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg SLA</p>
                <p className="text-3xl font-bold text-orange-600">
                  {requestTypes.length > 0 ? Math.round(requestTypes.reduce((acc, type) => acc + type.sla, 0) / requestTypes.length) : 0}h
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search request types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Request Types List */}
      <div className="grid gap-4">
        {filteredTypes.map((type: any) => (
          <Card key={type._id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Tag className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">{type.name}</h3>
                    <Badge variant="outline">{type.category}</Badge>
                    {!type.isActive && (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{type.description}</p>
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      {getPriorityIcon(type.priority)}
                      <span>Priority: </span>
                      <Badge className={`${getPriorityColor(type.priority)} border-0 text-xs`}>
                        {type.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>SLA: {type.sla} hours</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Tag className="h-4 w-4" />
                      <span>{type.ticketCount} tickets</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={type.isActive}
                    onCheckedChange={() => toggleRequestTypeStatus(type._id)}
                  />
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(type)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setDeleteRequestTypeId(type._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Request Type</DialogTitle>
            <DialogDescription>
              Update the details for this request type.
            </DialogDescription>
          </DialogHeader>
          {editRequestType && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editRequestType.name}
                  onChange={(e) => handleEditInputChange('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editRequestType.description}
                  onChange={(e) => handleEditInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Input
                  id="edit-category"
                  value={editRequestType.category}
                  onChange={(e) => handleEditInputChange('category', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select
                    value={editRequestType.priority}
                    onValueChange={(value) => handleEditInputChange('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-sla">SLA (hours)</Label>
                  <Input
                    id="edit-sla"
                    type="number"
                    value={editRequestType.sla}
                    onChange={(e) => handleEditInputChange('sla', parseInt(e.target.value))}
                    min="1"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-active"
                  checked={editRequestType.isActive}
                  onCheckedChange={(checked) => handleEditInputChange('isActive', checked)}
                />
                <Label htmlFor="edit-active">Active</Label>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={editRequestType}>
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteRequestTypeId} onOpenChange={(open) => !open && setDeleteRequestTypeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the request type.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteRequestTypeId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteRequestTypeId && handleDeleteRequestType(deleteRequestTypeId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}