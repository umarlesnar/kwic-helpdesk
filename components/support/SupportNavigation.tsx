//components/support/SupportNavigation.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Ticket,
  Users,
  BarChart3,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/shared/AuthProvider';
import { Badge } from '@/components/ui/badge';

const navigation = [
  { name: 'Dashboard', href: '/support', icon: LayoutDashboard },
  { name: 'All Tickets', href: '/support/tickets', icon: Ticket, showBubble: true },
  { name: 'My Tickets', href: '/support/my-tickets', icon: Users, showBubble: true },
  { name: 'Pending', href: '/support/tickets?status=open,in_progress', icon: Clock },
  { name: 'Resolved', href: '/support/tickets?status=resolved,closed', icon: CheckCircle },
  { name: 'Analytics', href: '/support/analytics', icon: BarChart3 },
];

export function SupportNavigation() {
  const pathname = usePathname();
  const { token, user } = useAuth();
  const [allTicketsCount, setAllTicketsCount] = useState<number | null>(null);
  const [myTicketsCount, setMyTicketsCount] = useState<number | null>(null);
  const [bubbleSeen, setBubbleSeen] = useState<boolean>(false);
  const [myTicketsBubbleSeen, setMyTicketsBubbleSeen] = useState<boolean>(false);
  const [lastSeenCount, setLastSeenCount] = useState<number>(0);
  const [lastSeenMyTicketsCount, setLastSeenMyTicketsCount] = useState<number>(0);
  
  useEffect(() => {
    const fetchAllTickets = async () => {
      try {
        const res = await fetch('/api/tickets', {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        });
        if (res.ok) {
          const data = await res.json();
          const count = Array.isArray(data) ? data.length : 0;
          setAllTicketsCount(count);

          const seenCount = parseInt(localStorage.getItem('allTicketsSeenCount') || '0');
          setLastSeenCount(seenCount);
          if (count > seenCount) {
            setBubbleSeen(false); // New tickets exist
          }
        }
      } catch (err) {
        console.error('Error fetching all tickets:', err);
        setAllTicketsCount(null);
      }
    };

    const fetchMyTickets = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`/api/tickets?assigneeId=${user.id}`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        });
        if (res.ok) {
          const data = await res.json();
          const count = Array.isArray(data) ? data.length : 0;
          setMyTicketsCount(count);

          const seenMyTicketsCount = parseInt(localStorage.getItem(`myTicketsSeenCount_${user.id}`) || '0');
          setLastSeenMyTicketsCount(seenMyTicketsCount);
          if (count > seenMyTicketsCount) {
            setMyTicketsBubbleSeen(false); // New tickets exist
          }
        }
      } catch (err) {
        console.error('Error fetching my tickets:', err);
        setMyTicketsCount(null);
      }
    };

    if (token) {
      fetchAllTickets();
      if (user) fetchMyTickets();
    }
  }, [token, user]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const seenCount = parseInt(localStorage.getItem('allTicketsSeenCount') || '0');
      const currentBubbleSeen = localStorage.getItem('allTicketsBubbleSeen') === 'true';
      const myTicketsSeen = localStorage.getItem(`myTicketsBubbleSeen_${user?.id}`) === 'true';
      setLastSeenCount(seenCount);
      setBubbleSeen(currentBubbleSeen);
      setMyTicketsBubbleSeen(myTicketsSeen);
    }
  }, []);

  useEffect(() => {
    if (pathname === '/support/tickets' && allTicketsCount !== null) {
      setBubbleSeen(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('allTicketsBubbleSeen', 'true');
        localStorage.setItem('allTicketsSeenCount', allTicketsCount.toString());
      }
    }

    if (pathname === '/support/my-tickets' && myTicketsCount !== null && user?.id) {
      setMyTicketsBubbleSeen(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`myTicketsBubbleSeen_${user.id}`, 'true');
        localStorage.setItem(`myTicketsSeenCount_${user.id}`, myTicketsCount.toString());
      }
    }
  }, [pathname, allTicketsCount]);

  return (
    <div className="flex space-x-8 py-4">
      {navigation.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== '/support' && pathname.startsWith(item.href));

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center gap-1 px-2 py-2 text-sm font-medium rounded-md transition-colors',
              isActive
                ? 'bg-green-100 text-green-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.name}</span>

            {/* All Tickets Bubble */}
            {item.name === 'All Tickets' &&
              item.showBubble &&
              allTicketsCount !== null &&
              allTicketsCount > lastSeenCount &&
              !bubbleSeen &&
              pathname !== item.href && (
                <Badge className="ml-1 bg-green-500 text-white px-1 py-0.5 rounded-xl min-w-[1.4rem] justify-center" variant="secondary">
                  {allTicketsCount - lastSeenCount}
                </Badge>
              )}

            {/* My Tickets Bubble */}
            {item.name === 'My Tickets' &&
              item.showBubble &&
              user?.id &&
              myTicketsCount !== null &&
              myTicketsCount > lastSeenMyTicketsCount &&
              !myTicketsBubbleSeen &&
              pathname !== item.href && (
                <Badge className="ml-1 bg-blue-500 text-white px-1 py-0.5 rounded-xl min-w-[1.4rem] justify-center" variant="secondary">
                  {myTicketsCount}
                </Badge>
              )}
          </Link>
        );
      })}
    </div>
  );
}
