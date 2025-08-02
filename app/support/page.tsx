//app/support/page.tsx
'use client';

import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Layout } from '@/components/shared/Layout';
import { SupportDashboard } from '@/components/support/SupportDashboard';
import { SupportNavigation } from '@/components/support/SupportNavigation';

export default function SupportPage() {
  return (
    <ProtectedRoute allowedRoles={['agent', 'admin']}>
      <Layout title="Support Dashboard" navigation={<SupportNavigation />}>
        <SupportDashboard />
      </Layout>
    </ProtectedRoute>
  );
}