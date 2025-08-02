//app/customer/tickets/new/page.tsx
'use client';

import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Layout } from '@/components/shared/Layout';
import { CreateTicketForm } from '@/components/customer/CreateTicketForm';

export default function NewTicketPage() {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      <Layout title="Create New Request">
        <CreateTicketForm />
      </Layout>
    </ProtectedRoute>
  );
}