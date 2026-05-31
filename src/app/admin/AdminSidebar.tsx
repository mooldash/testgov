'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderTree,
  GraduationCap,
  Library,
  Users,
  KeyRound,
  CreditCard,
  Settings,
  Star,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/admin', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/admin/categories', label: 'Категории', icon: FolderTree },
  { href: '/admin/programs', label: 'Программы', icon: GraduationCap },
  { href: '/admin/modules', label: 'Модули', icon: Library },
  { href: '/admin/users', label: 'Пользователи', icon: Users },
  { href: '/admin/access', label: 'Доступы', icon: KeyRound },
  { href: '/admin/orders', label: 'Заказы', icon: CreditCard },
  { href: '/admin/reviews', label: 'Отзывы', icon: Star },
  { href: '/admin/news', label: 'Новости', icon: Newspaper },
  { href: '/admin/settings', label: 'Настройки', icon: Settings },
];

function shouldAutoCollapse(pathname: string): boolean {
  // /admin → 2 segments; /admin/categories → 3; /admin/categories/X → 4
  const len = pathname.split('/').filter(Boolean).length;
  return len >= 3;
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  return pathname === href || pathname.startsWith(href + '/');
}

export function AdminSidebar() {
  const pathname = usePathname();
  const auto = shouldAutoCollapse(pathname);
  const [manualOverride, setManualOverride] = useState<boolean | null>(null);

  // Reset manual override when route's auto-state flips
  useEffect(() => {
    setManualOverride(null);
  }, [auto]);

  const collapsed = manualOverride ?? auto;

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r bg-muted/30 transition-[width] duration-200 sticky top-0 self-start h-screen',
        collapsed ? 'w-14' : 'w-60'
      )}
    >
      <div
        className={cn(
          'h-14 flex items-center border-b',
          collapsed ? 'justify-center px-0' : 'justify-between px-4'
        )}
      >
        {!collapsed && (
          <span className="font-semibold tracking-tight text-sm">testgov / admin</span>
        )}
        <button
          type="button"
          onClick={() => setManualOverride(!collapsed)}
          className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
          title={collapsed ? 'Раскрыть сайдбар' : 'Свернуть сайдбар'}
          aria-label={collapsed ? 'Раскрыть сайдбар' : 'Свернуть сайдбар'}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-md transition-colors text-sm',
                collapsed ? 'h-10 w-10 justify-center mx-auto' : 'h-9 px-3',
                active
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'text-foreground/80 hover:bg-background hover:text-foreground'
              )}
            >
              <Icon className={cn('shrink-0', collapsed ? 'h-5 w-5' : 'h-4 w-4')} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
