//app/customer/tickets/[id]/page.tsx
'use client';

import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Layout } from '@/components/shared/Layout';
import { CustomerTicketDetail } from '@/components/customer/CustomerTicketDetail';

export default function CustomerTicketDetailPage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <Layout title="Request Details">
        <CustomerTicketDetail ticketId={params.id} />
      </Layout>
    </ProtectedRoute>
  );
}