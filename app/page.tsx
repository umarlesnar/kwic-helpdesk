//app/page.tsx
'use client';

import { useAuth } from '@/components/shared/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else {
        // Redirect based on user role
        switch (user.role) {
          case 'customer':
            router.push('/customer');
            break;
          case 'agent':
            router.push('/support');
            break;
          case 'admin':
            router.push('/admin');
            break;
          default:
            router.push('/login');
        }
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return null;
}