//app/support/analytics/page.tsx
'use client';

import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Layout } from '@/components/shared/Layout';
import { SupportAnalytics } from '@/components/support/SupportAnalytics';
import { SupportNavigation } from '@/components/support/SupportNavigation';

export default function SupportAnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={['agent', 'admin']}>
      <Layout title="Analytics" navigation={<SupportNavigation />}>
        <SupportAnalytics />
      </Layout>
    </ProtectedRoute>
  );
}