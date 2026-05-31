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
import { Award, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgramShell } from '@/components/program/ProgramShell';
import { StartExamButton } from '../../programs/[slug]/StartExamButton';

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

  const module = await prisma.module.findUnique({
    where: { id },
    include: {
      programs: {
        include: { program: { select: { id: true, slug: true, isDemo: true } } },
      },
      contents: { where: { locale: dbLocale(locale) } },
      tests: { where: { locale: dbLocale(locale), isPublished: true } },
    },
  });
  if (!module) notFound();

  // Resolve which program context to show in sidebar / back-link
  let programId = programIdParam;
  if (!programId || !module.programs.some((pm) => pm.programId === programId)) {
    // Pick the first accessible program (demo for anon, otherwise first the user has access to)
    for (const pm of module.programs) {
      const ok = await hasProgramAccess(session?.user?.id ?? null, pm.programId);
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

  const allowed = await hasProgramAccess(session?.user?.id ?? null, programId);
  if (!allowed) {
    const prog = module.programs.find((pm) => pm.programId === programId)?.program;
    // For anonymous users on a paid program — redirect to login
    if (!session?.user) redirect(`/${locale}/login`);
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
  const isExam = module.type === 'EXAM';
  const examTitle =
    content?.title ?? (locale === 'kk' ? 'Қорытынды емтихан' : 'Итоговый экзамен');

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

        {isExam ? (
          <Card className="mt-4 border-2 border-amber-500/40 bg-gradient-to-br from-amber-50/60 to-transparent dark:from-amber-950/20">
            <CardContent className="pt-6 pb-6 px-6 space-y-4">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400">
                  <Award className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wide font-semibold text-amber-700 dark:text-amber-400">
                    <Sparkles className="h-3 w-3" />
                    {locale === 'kk' ? 'Қорытынды емтихан' : 'Итоговый экзамен'}
                  </div>
                  <h1 className="text-2xl font-bold leading-tight mt-1">{examTitle}</h1>
                </div>
              </div>

              <div className="text-sm text-muted-foreground leading-relaxed">
                {locale === 'kk'
                  ? `Бағдарламаның әр тестінен ${module.examQuestionsPerTest ?? 15} кездейсоқ сұрақ. ` +
                    `Уақыт: ${Math.round((module.examTimeLimitSec ?? 5400) / 60)} мин. ` +
                    `Өту балы: ${module.examPassingScore ?? 60}%.`
                  : `${module.examQuestionsPerTest ?? 15} случайных вопросов с каждого теста программы. ` +
                    `Время на весь экзамен: ${Math.round((module.examTimeLimitSec ?? 5400) / 60)} мин. ` +
                    `Проходной балл: ${module.examPassingScore ?? 60}%.`}
              </div>

              <StartExamButton
                moduleId={module.id}
                programId={programId}
                locale={locale}
                label={locale === 'kk' ? 'Емтиханды бастау' : 'Начать экзамен'}
              />
            </CardContent>
          </Card>
        ) : null}

        {!isExam && content && (
          <article className="mt-4">
            <h1 className="text-3xl font-semibold mb-6">{content.title}</h1>
            <div
              className="prose-content"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.bodyHtml) }}
            />
          </article>
        )}

        {!isExam && module.tests.length > 0 && (
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
