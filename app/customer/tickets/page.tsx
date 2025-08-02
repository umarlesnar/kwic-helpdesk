//app/customer/tickets/page.tsx
'use client';

import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Layout } from '@/components/shared/Layout';
import { CustomerTicketList } from '@/components/customer/CustomerTicketList';

export default function CustomerTicketsPage() {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <Layout title="My Requests">
        <CustomerTicketList />
      </Layout>
    </ProtectedRoute>
  );
}