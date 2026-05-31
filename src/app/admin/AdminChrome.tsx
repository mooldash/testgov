'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function isEditorRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return /^\/admin\/news\/[^/]+$/.test(pathname) && pathname !== '/admin/news';
}

export function AdminHeader({
  email,
  signOut,
}: {
  email: string;
  signOut: React.ReactNode;
}) {
  const pathname = usePathname();
  if (isEditorRoute(pathname)) return null;

  return (
    <header className="h-14 border-b flex items-center justify-between px-6">
      <div className="text-sm text-muted-foreground">{email}</div>
      <div className="flex items-center gap-2">
        <Link href="/ru" className="text-sm text-muted-foreground hover:text-foreground">
          ↗ Сайт
        </Link>
        {signOut}
      </div>
    </header>
  );
}

export function AdminMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const editor = isEditorRoute(pathname);
  return (
    <main className={editor ? 'flex-1 flex flex-col' : 'flex-1 p-6 overflow-x-auto'}>
      {children}
    </main>
  );
}
