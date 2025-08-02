//app/support/my-tickets/page.tsx
'use client';

import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Layout } from '@/components/shared/Layout';
import { SupportTicketList } from '@/components/support/SupportTicketList';
import { SupportNavigation } from '@/components/support/SupportNavigation';

export default function MyTicketsPage() {
  return (
    <ProtectedRoute allowedRoles={['agent', 'admin']}>
      <Layout title="My Tickets" navigation={<SupportNavigation />}>
        <SupportTicketList showMyTicketsOnly={true} />
      </Layout>
    </ProtectedRoute>
  );
}