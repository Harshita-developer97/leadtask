'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Kanban, LayoutDashboard, Users, Users2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Role } from '@prisma/client';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/leads', label: 'Leads', icon: Users2 },
  { href: '/dashboard/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/dashboard/users', label: 'Team', icon: Users, adminOnly: true },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3, adminOnly: true },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card md:flex md:flex-col">
      <div className="flex h-16 items-center px-6">
        <Link href="/dashboard" className="font-display text-lg font-semibold tracking-tight">
          Lead<span className="text-signal-copper">Flow</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2" aria-label="Dashboard navigation">
        {NAV_ITEMS.filter((item) => !item.adminOnly || role === 'ADMIN').map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-ring',
                active ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4 text-xs text-muted-foreground">
        Signed in as <span className="font-medium text-foreground">{role === 'ADMIN' ? 'Admin' : 'Member'}</span>
      </div>
    </aside>
  );
}
