import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { isLocale } from '@/i18n/config';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardTabs } from './DashboardTabs';

export const metadata: Metadata = {
  title: 'Личный кабинет',
  robots: { index: false, follow: false },
};

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();

  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const [user, access, attempts, orders] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    }),
    prisma.userAccess.findMany({
      where: { userId: session.user.id, expiresAt: { gt: new Date() } },
      include: {
        program: {
          select: {
            slug: true,
            nameRu: true,
            nameKk: true,
            descriptionRu: true,
            descriptionKk: true,
          },
        },
      },
      orderBy: { expiresAt: 'desc' },
    }),
    prisma.attempt.findMany({
      where: { userId: session.user.id, finishedAt: { not: null } },
      include: { test: { select: { title: true } } },
      orderBy: { finishedAt: 'desc' },
      take: 50,
    }),
    prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        program: { select: { slug: true, nameRu: true, nameKk: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  return (
    <div className="container py-12">
      <div className="flex items-baseline justify-between mb-8">
        <h1 className="text-3xl font-semibold">{t('dashboard.title')}</h1>
        <div className="text-sm text-muted-foreground">{session.user.email}</div>
      </div>

      <DashboardTabs
        locale={locale}
        user={{ name: user?.name ?? '', email: user?.email ?? session.user.email ?? '' }}
        access={access}
        attempts={attempts}
        orders={orders}
        labels={{
          tabAccess: locale === 'kk' ? 'Қолжетімділік' : 'Доступы',
          tabResults: locale === 'kk' ? 'Нәтижелер' : 'Результаты',
          tabOrders: locale === 'kk' ? 'Тапсырыстар' : 'Заказы',
          tabSettings: locale === 'kk' ? 'Баптаулар' : 'Настройки',
          noAccess: t('dashboard.no_access'),
          noHistory: t('dashboard.no_history'),
          noOrders: locale === 'kk' ? 'Әзірге тапсырыстар жоқ' : 'Заказов пока нет',
          expiresAt: locale === 'kk' ? 'Аяқталады' : 'Истекает',
          testName: t('dashboard.test_name'),
          date: t('dashboard.date'),
          score: t('dashboard.score'),
          result: t('dashboard.result'),
          view: t('dashboard.view'),
          resultPassed: t('test.result_passed'),
          resultFailed: t('test.result_failed'),
        }}
      />
    </div>
  );
}
