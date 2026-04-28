import Link from 'next/link';
import { redirect } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { auth, signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Providers } from '@/components/site/Providers';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/ru/login?callbackUrl=/admin');
  if (session.user.role !== 'ADMIN') redirect('/ru');

  const messages = await getMessages({ locale: 'ru' });

  return (
    <NextIntlClientProvider locale="ru" messages={messages}>
      <Providers>
        <div className="flex min-h-screen">
          <aside className="w-60 border-r bg-muted/30 hidden md:block">
            <div className="p-4 font-semibold tracking-tight border-b">testgov / admin</div>
            <nav className="p-2 text-sm">
              <SidebarLink href="/admin">Дашборд</SidebarLink>
              <SidebarLink href="/admin/categories">Категории</SidebarLink>
              <SidebarLink href="/admin/programs">Программы</SidebarLink>
              <SidebarLink href="/admin/modules">Модули</SidebarLink>
              <SidebarLink href="/admin/tests">Тесты</SidebarLink>
              <SidebarLink href="/admin/users">Пользователи</SidebarLink>
              <SidebarLink href="/admin/access">Доступы</SidebarLink>
              <SidebarLink href="/admin/orders">Заказы</SidebarLink>
            </nav>
          </aside>
          <div className="flex-1 flex flex-col">
            <header className="h-14 border-b flex items-center justify-between px-6">
              <div className="text-sm text-muted-foreground">{session.user.email}</div>
              <div className="flex items-center gap-2">
                <Link href="/ru" className="text-sm text-muted-foreground hover:text-foreground">
                  ↗ Сайт
                </Link>
                <form
                  action={async () => {
                    'use server';
                    await signOut({ redirectTo: '/ru' });
                  }}
                >
                  <Button type="submit" variant="ghost" size="sm">
                    Выйти
                  </Button>
                </form>
              </div>
            </header>
            <main className="flex-1 p-6 overflow-x-auto">{children}</main>
          </div>
        </div>
      </Providers>
    </NextIntlClientProvider>
  );
}

function SidebarLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block px-3 py-2 rounded-md hover:bg-background hover:shadow-sm transition-all"
    >
      {children}
    </Link>
  );
}
