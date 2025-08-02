//app/support/tickets/[id]/page.tsx
'use client';

import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Layout } from '@/components/shared/Layout';
import { SupportTicketDetail } from '@/components/support/SupportTicketDetail';
import { SupportNavigation } from '@/components/support/SupportNavigation';

export default function SupportTicketDetailPage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute allowedRoles={['agent', 'admin']}>
      <Layout title="Ticket Details" navigation={<SupportNavigation />}>
        <SupportTicketDetail ticketId={params.id} />
      </Layout>
    </ProtectedRoute>
  );
}