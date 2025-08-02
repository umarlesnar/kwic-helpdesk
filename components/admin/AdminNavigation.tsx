//components/admin/AdminNavigation.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Settings,
  BarChart3,
  Shield,
  Tag
} from 'lucide-react';
const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Teams', href: '/admin/teams', icon: UserCheck },
  { name: 'Request Types', href: '/admin/request-types', icon: Tag },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'System Settings', href: '/admin/settings', icon: Settings },
  { name: 'Security', href: '/admin/security', icon: Shield },
];

export function AdminNavigation() {
  const pathname = usePathname();
  return (
    <div className="flex space-x-8 py-4">
      {navigation.map((item) => {
        const isActive = pathname === item.href ||
          (item.href !== '/admin' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
              isActive
                ? 'bg-green-100 text-green-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </div>
  );
}