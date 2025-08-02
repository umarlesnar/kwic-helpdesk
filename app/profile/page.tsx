//app/profile/page.tsx
'use client';

import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Layout } from '@/components/shared/Layout';
import { useAuth } from '@/components/shared/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Mail, Calendar, Shield } from 'lucide-react';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <ProtectedRoute>
      <Layout title="Profile">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-green-100 text-green-600 text-xl">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{user.name}</CardTitle>
                  <CardDescription className="text-lg">{user.email}</CardDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 capitalize">{user.role}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                View and manage your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={user.name}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={user.role}
                    disabled
                    className="bg-gray-50 capitalize"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userId">User ID</Label>
                  <Input
                    id="userId"
                    value={user.id}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button disabled className="opacity-50">
                  Edit Profile (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Statistics */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <User className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Account Type</p>
                    <p className="text-2xl font-bold capitalize">{user.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Mail className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Email Status</p>
                    <p className="text-2xl font-bold">Verified</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Calendar className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Member Since</p>
                    <p className="text-lg font-bold">Jan 2024</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}