//app/support/tickets/page.tsx
'use client';

import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Layout } from '@/components/shared/Layout';
import { SupportTicketList } from '@/components/support/SupportTicketList';
import { SupportNavigation } from '@/components/support/SupportNavigation';

export default function SupportTicketsPage() {
  return (
    <ProtectedRoute allowedRoles={['agent', 'admin']}>
      <Layout title="All Tickets" navigation={<SupportNavigation />}>
        <SupportTicketList />
      </Layout>
    </ProtectedRoute>
  );
}