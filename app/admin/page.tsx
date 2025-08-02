//app/admin/page.tsx
'use client';

import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Layout } from '@/components/shared/Layout';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminNavigation } from '@/components/admin/AdminNavigation';

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Layout title="Admin Dashboard" navigation={<AdminNavigation />}>
        <AdminDashboard />
      </Layout>
    </ProtectedRoute>
  );
}