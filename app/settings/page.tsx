//app/settings/page.tsx
'use client';

import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Layout } from '@/components/shared/Layout';
import { useAuth } from '@/components/shared/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Mail, 
  Shield, 
  Palette, 
  Globe, 
  Lock,
  Smartphone,
  Monitor
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <ProtectedRoute>
      <Layout title="Settings">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Manage how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-gray-500">
                    Receive email updates about your tickets
                  </p>
                </div>
                <Switch id="email-notifications" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ticket-updates">Ticket Updates</Label>
                  <p className="text-sm text-gray-500">
                    Get notified when tickets are updated
                  </p>
                </div>
                <Switch id="ticket-updates" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="comment-notifications">New Comments</Label>
                  <p className="text-sm text-gray-500">
                    Receive notifications for new comments
                  </p>
                </div>
                <Switch id="comment-notifications" defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-500">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Button variant="outline" disabled>
                  Enable (Coming Soon)
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Change Password</Label>
                  <p className="text-sm text-gray-500">
                    Update your account password
                  </p>
                </div>
                <Button variant="outline" disabled>
                  Change (Coming Soon)
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Active Sessions</Label>
                  <p className="text-sm text-gray-500">
                    Manage your active login sessions
                  </p>
                </div>
                <Button variant="outline" disabled>
                  View Sessions (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize how the interface looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Theme</Label>
                  <p className="text-sm text-gray-500">
                    Choose your preferred color scheme
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled>
                    <Monitor className="h-4 w-4 mr-2" />
                    System
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="compact-mode">Compact Mode</Label>
                  <p className="text-sm text-gray-500">
                    Use a more compact interface layout
                  </p>
                </div>
                <Switch id="compact-mode" />
              </div>
            </CardContent>
          </Card>

          {/* Language & Region */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Language & Region
              </CardTitle>
              <CardDescription>
                Set your language and regional preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Language</Label>
                  <p className="text-sm text-gray-500">
                    Choose your preferred language
                  </p>
                </div>
                <Button variant="outline" disabled>
                  English (Coming Soon)
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Timezone</Label>
                  <p className="text-sm text-gray-500">
                    Set your local timezone
                  </p>
                </div>
                <Button variant="outline" disabled>
                  UTC (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Lock className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                <div className="space-y-0.5">
                  <Label className="text-red-800">Delete Account</Label>
                  <p className="text-sm text-red-600">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Button variant="destructive" disabled>
                  Delete Account (Coming Soon)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}