import Link from 'next/link';
import { redirect } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { auth, signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Providers } from '@/components/site/Providers';
import { AdminSidebar } from './AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/ru/login?callbackUrl=/admin');
  if (session.user.role !== 'ADMIN') redirect('/ru');

  const messages = await getMessages({ locale: 'ru' });

  return (
    <NextIntlClientProvider locale="ru" messages={messages}>
      <Providers>
        <div className="flex min-h-screen">
          <AdminSidebar />
          <div className="flex-1 min-w-0 flex flex-col">
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
