import { redirect } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { auth, signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Providers } from '@/components/site/Providers';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader, AdminMain } from './AdminChrome';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/ru/login?callbackUrl=/admin');
  if (session.user.role !== 'ADMIN') redirect('/ru');

  const messages = await getMessages({ locale: 'ru' });

  const signOutForm = (
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
  );

  return (
    <NextIntlClientProvider locale="ru" messages={messages}>
      <Providers>
        <div className="flex min-h-screen">
          <AdminSidebar />
          <div className="flex-1 min-w-0 flex flex-col">
            <AdminHeader email={session.user.email!} signOut={signOutForm} />
            <AdminMain>{children}</AdminMain>
          </div>
        </div>
      </Providers>
    </NextIntlClientProvider>
  );
}
