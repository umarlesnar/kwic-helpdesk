//components/shared/ProtectedRoute.tsx
'use client';

import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('customer' | 'agent' | 'admin')[];
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles = ['customer', 'agent', 'admin'],
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push(redirectTo);
      } else if (!allowedRoles.includes(user.role)) {
        // Redirect based on role
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
        }
      }
    }
  }, [user, isLoading, router, allowedRoles, redirectTo]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}