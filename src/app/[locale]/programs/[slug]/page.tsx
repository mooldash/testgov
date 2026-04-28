import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { isLocale, dbLocale } from '@/i18n/config';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { hasProgramAccess } from '@/lib/access';
import { formatDate, formatTenge, pluckLocalized } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BuyButton } from './BuyButton';

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();

  const program = await prisma.program.findUnique({
    where: { slug },
    include: {
      category: true,
      modules: {
        where: { isPublished: true },
        orderBy: { order: 'asc' },
        include: {
          contents: { where: { locale: dbLocale(locale) } },
          tests: { where: { locale: dbLocale(locale), isPublished: true }, select: { id: true, title: true } },
        },
      },
    },
  });
  if (!program) notFound();

  const session = await auth();
  let access: { expiresAt: Date } | null = null;
  if (session?.user) {
    const a = await prisma.userAccess.findFirst({
      where: { userId: session.user.id, programId: program.id, expiresAt: { gt: new Date() } },
      orderBy: { expiresAt: 'desc' },
    });
    if (a) access = { expiresAt: a.expiresAt };
  }
  const allowed = session?.user?.role === 'ADMIN' || Boolean(access);

  return (
    <div className="container py-12">
      <Link
        href={`/${locale}/categories/${program.category.slug}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← {pluckLocalized(program.category, 'name', locale)}
      </Link>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mt-2 mb-8">
        <div>
          <h1 className="text-3xl font-semibold">{pluckLocalized(program, 'name', locale)}</h1>
          <p className="text-muted-foreground mt-1">{pluckLocalized(program, 'description', locale)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {access ? (
            <Badge variant="success">{t('program.owned_until', { date: formatDate(access.expiresAt, locale) })}</Badge>
          ) : session?.user?.role === 'ADMIN' ? (
            <Badge variant="secondary">ADMIN</Badge>
          ) : (
            <BuyButton
              programId={program.id}
              priceLabel={t('program.buy_for', { price: formatTenge(program.priceTenge) })}
              locale={locale}
              authed={Boolean(session?.user)}
            />
          )}
          <span className="text-xs text-muted-foreground">{t('program.duration', { days: program.durationDays })}</span>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">{t('program.modules')}</h2>
      <div className="space-y-3">
        {program.modules.map((m) => {
          const lawTitle = m.contents[0]?.title;
          return (
            <Card key={m.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {m.type === 'LAW'
                      ? lawTitle ?? t('module.law_content')
                      : `${t('module.tests')} #${m.order}`}
                  </CardTitle>
                  <Badge variant="outline">{m.type === 'LAW' ? t('module.law_content') : t('module.tests')}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {!allowed ? (
                  <p className="text-sm text-muted-foreground">{t('program.no_access')}</p>
                ) : (
                  <div className="space-y-2">
                    {m.type === 'LAW' && m.contents[0] && (
                      <Link
                        href={`/${locale}/modules/${m.id}`}
                        className="block text-sm text-primary hover:underline"
                      >
                        {t('module.law_content')} →
                      </Link>
                    )}
                    {m.tests.map((tst) => (
                      <Link
                        key={tst.id}
                        href={`/${locale}/tests/${tst.id}`}
                        className="block text-sm text-primary hover:underline"
                      >
                        {tst.title} →
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
