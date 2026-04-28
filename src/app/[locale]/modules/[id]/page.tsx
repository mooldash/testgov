import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';
import { isLocale, dbLocale } from '@/i18n/config';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { hasProgramAccess } from '@/lib/access';
import { sanitizeHtml } from '@/lib/sanitize';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ModulePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();

  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const module = await prisma.module.findUnique({
    where: { id },
    include: {
      program: true,
      contents: { where: { locale: dbLocale(locale) } },
      tests: { where: { locale: dbLocale(locale), isPublished: true } },
    },
  });
  if (!module) notFound();

  const allowed = await hasProgramAccess(session.user.id, module.programId);
  if (!allowed) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground mb-4">{t('test.no_access')}</p>
        <Link href={`/${locale}/programs/${module.program.slug}`} className="text-primary underline">
          ← {t('common.back')}
        </Link>
      </div>
    );
  }

  const content = module.contents[0];

  return (
    <div className="container py-12 max-w-3xl">
      <Link
        href={`/${locale}/programs/${module.program.slug}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← {t('common.back')}
      </Link>

      {content && (
        <article className="mt-4">
          <h1 className="text-3xl font-semibold mb-6">{content.title}</h1>
          <div
            className="prose-content"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.bodyHtml) }}
          />
        </article>
      )}

      {module.tests.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-3">{t('module.tests')}</h2>
          <div className="space-y-2">
            {module.tests.map((tst) => (
              <Card key={tst.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    <Link href={`/${locale}/tests/${tst.id}`} className="hover:text-primary">
                      {tst.title} →
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {t(`test.mode_${tst.mode}` as 'test.mode_CLASSIC')}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
