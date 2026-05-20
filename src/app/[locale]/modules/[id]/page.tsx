import Link from 'next/link';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';

export const metadata: Metadata = { robots: { index: false, follow: false } };
import { isLocale, dbLocale } from '@/i18n/config';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { hasProgramAccess } from '@/lib/access';
import { sanitizeHtml } from '@/lib/sanitize';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgramShell } from '@/components/program/ProgramShell';

export default async function ModulePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ program?: string }>;
}) {
  const { locale, id } = await params;
  const { program: programIdParam } = await searchParams;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();

  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);

  const module = await prisma.module.findUnique({
    where: { id },
    include: {
      programs: {
        include: { program: { select: { id: true, slug: true } } },
      },
      contents: { where: { locale: dbLocale(locale) } },
      tests: { where: { locale: dbLocale(locale), isPublished: true } },
    },
  });
  if (!module) notFound();

  // Resolve which program context to show in sidebar / back-link
  let programId = programIdParam;
  if (!programId || !module.programs.some((pm) => pm.programId === programId)) {
    // Pick the first program the user has access to (or first one if admin)
    for (const pm of module.programs) {
      const ok = await hasProgramAccess(session.user.id, pm.programId);
      if (ok) {
        programId = pm.programId;
        break;
      }
    }
    if (!programId) programId = module.programs[0]?.programId;
  }
  if (!programId) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground">Модуль не привязан к программе.</p>
      </div>
    );
  }

  const allowed = await hasProgramAccess(session.user.id, programId);
  if (!allowed) {
    const prog = module.programs.find((pm) => pm.programId === programId)?.program;
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground mb-4">{t('test.no_access')}</p>
        {prog && (
          <Link href={`/${locale}/programs/${prog.slug}`} className="text-primary underline">
            ← {t('common.back')}
          </Link>
        )}
      </div>
    );
  }

  const content = module.contents[0];
  const prog = module.programs.find((pm) => pm.programId === programId)?.program;

  return (
    <ProgramShell
      programId={programId}
      locale={locale}
      current={{ type: 'module', id: module.id }}
    >
      <div className="p-6 md:p-10 max-w-3xl">
        {prog && (
          <Link
            href={`/${locale}/programs/${prog.slug}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← {t('common.back')}
          </Link>
        )}

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
                      <Link
                        href={`/${locale}/tests/${tst.id}?program=${programId}`}
                        className="hover:text-primary"
                      >
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
    </ProgramShell>
  );
}
