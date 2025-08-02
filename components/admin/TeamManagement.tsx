// components/admin/TeamManagement.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/shared/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Users, 
  Edit, 
  Trash2, 
  UserPlus,
  Settings,
  MoreHorizontal
} from 'lucide-react';
import { toast } from 'sonner';

// Helper to safely parse JSON
async function safeParseJSON(res: Response) {
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  return null;
}

export function TeamManagement() {
  const { token } = useAuth();
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [addMemberTeamId, setAddMemberTeamId] = useState<string | null>(null);
  const [userOptions, setUserOptions] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignTeamId, setAssignTeamId] = useState<string | null>(null);
  const [requestTypeOptions, setRequestTypeOptions] = useState<any[]>([]);
  const [selectedRequestTypeIds, setSelectedRequestTypeIds] = useState<string[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const editNameRef = useRef<HTMLInputElement>(null);
  const editDescRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch('/api/teams', {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        
        if (!res.ok) {
          const errorData = await safeParseJSON(res) || {};
          throw new Error(errorData.error || 'Failed to fetch teams');
        }
        
        const data = await safeParseJSON(res);
        if (!data) throw new Error('No data returned from server');
        setTeams(data);
      } catch (error) {
        console.error('Error fetching teams:', error);
        toast.error(
          typeof error === 'object' && error !== null && 'message' in error
            ? (error as { message?: string }).message || 'Failed to fetch teams'
            : 'Failed to fetch teams'
        );
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTeams();
  }, [token]);

  const handleCreateTeam = async () => {
    if (!newTeam.name.trim()) {
      toast.error('Team name is required');
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newTeam),
      });
      
      if (!res.ok) {
        const errorData = await safeParseJSON(res) || {};
        throw new Error(errorData.error || 'Failed to create team');
      }
      
      const createdTeam = await safeParseJSON(res);
      if (!createdTeam) throw new Error('No data returned from server');
      setTeams(prev => [...prev, createdTeam]);
      setNewTeam({ name: '', description: '' });
      setIsCreateDialogOpen(false);
      toast.success('Team created successfully');
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error(
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message?: string }).message || 'Failed to create team'
          : 'Failed to create team'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      if (!res.ok) {
        const errorData = await safeParseJSON(res) || {};
        throw new Error(errorData.error || 'Failed to delete team');
      }
      
      setTeams(prev => prev.filter(t => t._id !== teamId));
      toast.success('Team deleted successfully');
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error(
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message?: string }).message || 'Failed to delete team'
          : 'Failed to delete team'
      );
    }
  };

  const handleAddMember = async (teamId: string, userId: string) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!res.ok) {
        const errorData = await safeParseJSON(res) || {};
        throw new Error(errorData.error || 'Failed to add member');
      }
      
      const updatedTeam = await safeParseJSON(res);
      if (!updatedTeam) throw new Error('No data returned from server');
      setTeams(prev => prev.map(t => t._id === teamId ? updatedTeam : t));
      toast.success('Member added successfully');
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error(
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message?: string }).message || 'Failed to add member'
          : 'Failed to add member'
      );
    }
  };

  const handleRemoveMember = async (teamId: string, userId: string) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!res.ok) {
        const errorData = await safeParseJSON(res) || {};
        throw new Error(errorData.error || 'Failed to remove member');
      }
      
      const updatedTeam = await safeParseJSON(res);
      if (!updatedTeam) throw new Error('No data returned from server');
      setTeams(prev => prev.map(t => t._id === teamId ? updatedTeam : t));
      toast.success('Member removed successfully');
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error(
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message?: string }).message || 'Failed to remove member'
          : 'Failed to remove member'
      );
    }
  };

  const handleAddRequestType = async (teamId: string, requestTypeId: string) => {
    try {
      const res = await fetch(`/api/teams/${teamId}/request-types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ requestTypeId }),
      });
      
      if (!res.ok) {
        const errorData = await safeParseJSON(res) || {};
        throw new Error(errorData.error || 'Failed to add request type');
      }
      
      const updatedTeam = await safeParseJSON(res);
      if (!updatedTeam) throw new Error('No data returned from server');
      setTeams(prev => prev.map(t => t._id === teamId ? updatedTeam : t));
      toast.success('Request type added successfully');
    } catch (error) {
      console.error('Error adding request type:', error);
      toast.error(
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message?: string }).message || 'Failed to add request type'
          : 'Failed to add request type'
      );
    }
  };

  const openEditDialog = (team: any) => {
    setEditTeam(team);
    setEditDialogOpen(true);
  };
  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setEditTeam(null);
  };
  const handleEditTeam = async () => {
    if (!editTeam || !editTeam._id) return;
    const name = editNameRef.current?.value.trim() || '';
    const description = editDescRef.current?.value || '';
    if (!name) {
      toast.error('Team name is required');
      return;
    }
    setEditLoading(true);
    try {
      const res = await fetch(`/api/teams/${editTeam._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) {
        const errorData = await safeParseJSON(res) || {};
        throw new Error(errorData.error || 'Failed to update team');
      }
      const updated = await safeParseJSON(res);
      if (!updated) throw new Error('No data returned from server');
      setTeams(prev => prev.map(t => t._id === updated._id ? updated : t));
      toast.success('Team updated successfully');
      closeEditDialog();
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error(
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message?: string }).message || 'Failed to update team'
          : 'Failed to update team'
      );
    } finally {
      setEditLoading(false);
    }
  };

  const openAddMemberDialog = async (team: any) => {
    setAddMemberDialogOpen(true);
    setAddMemberTeamId(team._id);
    setAddMemberError(null);
    setSelectedUserId('');
    try {
      // Only fetch agents
      const res = await fetch('/api/users?role=agent', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const users = await res.json();
      // Exclude users already in the team
      const memberIds = (team.members || []).map((m: any) => m._id?.toString?.() ?? m.toString?.());
      setUserOptions(users.filter((u: any) => !memberIds.includes(u._id.toString())));
    } catch (e) {
      setUserOptions([]);
      setAddMemberError('Failed to load users');
    }
  };
  const closeAddMemberDialog = () => {
    setAddMemberDialogOpen(false);
    setAddMemberTeamId(null);
    setUserOptions([]);
    setSelectedUserId('');
    setAddMemberError(null);
  };
  const handleAddMemberSubmit = async () => {
    if (!addMemberTeamId || !selectedUserId) return;
    setAddMemberLoading(true);
    setAddMemberError(null);
    try {
      await handleAddMember(addMemberTeamId, selectedUserId);
      closeAddMemberDialog();
    } catch (e: any) {
      setAddMemberError(e?.message || 'Failed to add member');
    } finally {
      setAddMemberLoading(false);
    }
  };

  const openAssignDialog = async (team: any) => {
    setAssignDialogOpen(true);
    setAssignTeamId(team._id);
    setAssignError(null);
    setSelectedRequestTypeIds(
      Array.isArray(team.requestTypes)
        ? team.requestTypes.filter(Boolean).map((rt: any) =>
            typeof rt === 'object' && rt !== null ? rt._id : String(rt)
          )
        : []
    );
    try {
      const res = await fetch('/api/request-types', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error('Failed to fetch request types');
      const types = await res.json();
      setRequestTypeOptions(types);
    } catch (e) {
      setRequestTypeOptions([]);
      setAssignError('Failed to load request types');
    }
  };
  const closeAssignDialog = () => {
    setAssignDialogOpen(false);
    setAssignTeamId(null);
    setRequestTypeOptions([]);
    setSelectedRequestTypeIds([]);
    setAssignError(null);
  };
  const handleAssignSubmit = async () => {
    if (!assignTeamId) return;
    setAssignLoading(true);
    setAssignError(null);
    try {
      // Send all selected request type IDs to backend
      const res = await fetch(`/api/teams/${assignTeamId}/request-types`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ requestTypeIds: selectedRequestTypeIds }),
      });
      if (!res.ok) {
        const errorData = await safeParseJSON(res) || {};
        throw new Error(errorData.error || 'Failed to assign request types');
      }
      const updatedTeam = await safeParseJSON(res);
      if (!updatedTeam) throw new Error('No data returned from server');
      setTeams(prev => prev.map(t => t._id === assignTeamId ? updatedTeam : t));
      toast.success('Request types assigned successfully');
      closeAssignDialog();
    } catch (e: any) {
      setAssignError(e?.message || 'Failed to assign request types');
    } finally {
      setAssignLoading(false);
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-1">
            Organize support agents into teams and manage their responsibilities
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className='bg-[#4ac959] hover:bg-[#4ac959]'>
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>
                Create a new support team to organize agents and manage request types.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter team name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-description">Description</Label>
                <Textarea
                  id="team-description"
                  value={newTeam.description}
                  onChange={(e) => setNewTeam(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the team's responsibilities"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isCreating}>
                  Cancel
                </Button>
                <Button className='bg-[#4ac959] hover:bg-[#4ac959]' onClick={handleCreateTeam} disabled={isCreating || !newTeam.name.trim()}>
                  {isCreating ? 'Creating...' : 'Create Team'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Teams</p>
                <p className="text-3xl font-bold text-gray-900">{teams.length}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-3xl font-bold text-green-600">
                  {teams.reduce((acc, team) => acc + (team.members?.length || 0), 0)}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Teams</p>
                <p className="text-3xl font-bold text-purple-600">
                  {teams.filter(team => team.members?.length > 0).length}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teams List */}
      <div className="grid gap-6">
        {Array.isArray(teams) && teams.length > 0 ? (
          teams.map((team, idx) => {
            // Normalize members and requestTypes for robust rendering
            const members = Array.isArray(team.members)
              ? team.members.filter(Boolean).map((m: any) =>
                  typeof m === 'object' && m !== null ? m : { _id: String(m), name: 'Unknown', email: '' }
                )
              : [];
            const requestTypes = Array.isArray(team.requestTypes)
              ? team.requestTypes.filter(Boolean).map((rt: any) =>
                  typeof rt === 'object' && rt !== null ? rt : { _id: String(rt), name: String(rt) }
                )
              : [];
            return (
              <Card key={team._id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">#{idx + 1}</span>
                        <Users className="h-5 w-5 text-blue-600" />
                        {team.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {team.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => openAddMemberDialog(team)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Member
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(team)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteTeam(team._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Team Members */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">
                        Team Members ({members.length})
                      </h4>
                      {members.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {members.map((member: any) => (
                            <div key={member._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                                  {member.name?.charAt(0)?.toUpperCase() || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{member.name || 'Unknown'}</p>
                                <p className="text-xs text-gray-600">{member.email || ''}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No team members assigned</p>
                          <Button variant="outline" size="sm" className="mt-2">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add First Member
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Request Types */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">
                        Handled Request Types ({requestTypes.length})
                      </h4>
                      {requestTypes.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {requestTypes.map((type: any) => (
                            <Badge key={type._id || type.name || type} variant="secondary">
                              {type.name || String(type)}
                            </Badge>
                          ))}
                          <Button variant="outline" size="sm" className="ml-2" onClick={() => openAssignDialog(team)}>
                            Assign Request Types
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <p className="text-sm">No request types assigned</p>
                          <Button variant="outline" size="sm" className="mt-2" onClick={() => openAssignDialog(team)}>
                            Assign Request Types
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center text-gray-500 py-8">No teams found.</div>
        )}
      </div>
      {/* Edit Team Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={v => { if (!v) closeEditDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>Update the team name and description.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-team-name">Team Name</Label>
              <Input
                id="edit-team-name"
                ref={editNameRef}
                defaultValue={editTeam?.name || ''}
                disabled={editLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-team-description">Description</Label>
              <Textarea
                id="edit-team-description"
                ref={editDescRef}
                defaultValue={editTeam?.description || ''}
                disabled={editLoading}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={closeEditDialog} disabled={editLoading}>
                Cancel
              </Button>
              <Button onClick={handleEditTeam} disabled={editLoading}>
                {editLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addMemberDialogOpen} onOpenChange={v => { if (!v) closeAddMemberDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>Select a user to add to this team.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {addMemberError && <div className="text-red-600 text-sm">{addMemberError}</div>}
            <div className="space-y-2">
              <Label htmlFor="add-member-select">User</Label>
              <select
                id="add-member-select"
                aria-label="Select user to add"
                className="w-full border rounded px-2 py-2"
                value={selectedUserId}
                onChange={e => setSelectedUserId(e.target.value)}
                disabled={addMemberLoading || userOptions.length === 0}
              >
                <option value="">Select a user...</option>
                {userOptions.map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={closeAddMemberDialog} disabled={addMemberLoading}>
                Cancel
              </Button>
              <Button onClick={handleAddMemberSubmit} disabled={addMemberLoading || !selectedUserId}>
                {addMemberLoading ? 'Adding...' : 'Add Member'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Request Types Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={v => { if (!v) closeAssignDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Request Types</DialogTitle>
            <DialogDescription>Select request types to assign to this team.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {assignError && <div className="text-red-600 text-sm">{assignError}</div>}
            <div className="space-y-2">
              <Label htmlFor="assign-request-types-select">Request Types</Label>
              <select
                id="assign-request-types-select"
                aria-label="Select request types to assign"
                multiple
                className="w-full border rounded px-2 py-2 h-32"
                value={selectedRequestTypeIds}
                onChange={e => {
                  const options = Array.from(e.target.selectedOptions).map(opt => opt.value);
                  setSelectedRequestTypeIds(options);
                }}
                disabled={assignLoading || requestTypeOptions.length === 0}
              >
                {requestTypeOptions.map(rt => (
                  <option key={rt._id} value={rt._id}>{rt.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={closeAssignDialog} disabled={assignLoading}>
                Cancel
              </Button>
              <Button onClick={handleAssignSubmit} disabled={assignLoading || selectedRequestTypeIds.length === 0}>
                {assignLoading ? 'Assigning...' : 'Assign'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}