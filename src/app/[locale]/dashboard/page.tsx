import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { isLocale } from '@/i18n/config';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatDate, formatDateTime, pluckLocalized } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();

  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const [access, attempts] = await Promise.all([
    prisma.userAccess.findMany({
      where: { userId: session.user.id, expiresAt: { gt: new Date() } },
      include: { program: true },
      orderBy: { expiresAt: 'desc' },
    }),
    prisma.attempt.findMany({
      where: { userId: session.user.id, finishedAt: { not: null } },
      include: { test: true },
      orderBy: { finishedAt: 'desc' },
      take: 25,
    }),
  ]);

  return (
    <div className="container py-12">
      <div className="flex items-baseline justify-between mb-8">
        <h1 className="text-3xl font-semibold">{t('dashboard.title')}</h1>
        <div className="text-sm text-muted-foreground">{session.user.email}</div>
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3">{t('dashboard.active_access')}</h2>
        {access.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('dashboard.no_access')}</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {access.map((a) => (
              <Card key={a.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    <Link href={`/${locale}/programs/${a.program.slug}`} className="hover:text-primary">
                      {pluckLocalized(a.program, 'name', locale)}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {t('dashboard.expires_at', { date: formatDate(a.expiresAt, locale) })}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">{t('dashboard.history')}</h2>
        {attempts.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('dashboard.no_history')}</p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="p-3 font-medium">{t('dashboard.test_name')}</th>
                  <th className="p-3 font-medium">{t('dashboard.date')}</th>
                  <th className="p-3 font-medium">{t('dashboard.score')}</th>
                  <th className="p-3 font-medium">{t('dashboard.result')}</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="p-3">{a.test.title}</td>
                    <td className="p-3 text-muted-foreground">{formatDateTime(a.finishedAt!, locale)}</td>
                    <td className="p-3 font-medium tabular-nums">{a.score}%</td>
                    <td className="p-3">
                      {a.passed ? (
                        <Badge variant="success">{t('test.result_passed')}</Badge>
                      ) : (
                        <Badge variant="destructive">{t('test.result_failed')}</Badge>
                      )}
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/${locale}/dashboard/attempts/${a.id}`}
                        className="text-primary hover:underline"
                      >
                        {t('dashboard.view')} →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
