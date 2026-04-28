import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { isLocale } from '@/i18n/config';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sanitizeHtml, } from '@/lib/sanitize';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatDateTime } from '@/lib/utils';

export default async function AttemptResultPage({
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

  const attempt = await prisma.attempt.findUnique({
    where: { id },
    include: {
      test: true,
      answers: true,
    },
  });
  if (!attempt || attempt.userId !== session.user.id) notFound();
  if (!attempt.finishedAt) redirect(`/${locale}/tests/${attempt.testId}`);

  const ids = attempt.questionOrder as string[];
  const questions = await prisma.question.findMany({
    where: { id: { in: ids } },
    include: { answers: { orderBy: { order: 'asc' } } },
  });
  const byId = new Map(questions.map((q) => [q.id, q]));
  const answersByQ = new Map(attempt.answers.map((a) => [a.questionId, a]));

  const showCorrect = attempt.test.showCorrectAnswers;

  return (
    <div className="container max-w-3xl py-12">
      <Link
        href={`/${locale}/dashboard`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← {t('dashboard.title')}
      </Link>

      <Card className="mt-4">
        <CardContent className="pt-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{attempt.test.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{formatDateTime(attempt.finishedAt, locale)}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold tabular-nums">{attempt.score}%</div>
            {attempt.passed ? (
              <Badge variant="success" className="mt-1">{t('test.result_passed')}</Badge>
            ) : (
              <Badge variant="destructive" className="mt-1">{t('test.result_failed')}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {showCorrect && (
        <div className="mt-6 space-y-4">
          {ids.map((qid, idx) => {
            const q = byId.get(qid);
            if (!q) return null;
            const ua = answersByQ.get(qid);
            return (
              <Card key={qid}>
                <CardContent className="pt-6">
                  <div className="text-xs text-muted-foreground mb-2">
                    {t('test.question_n', { n: idx + 1, total: ids.length })}
                  </div>
                  <div className="prose-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.textHtml) }} />
                  <div className="mt-3 space-y-2">
                    {q.answers.map((a) => {
                      const picked = ua?.answerId === a.id;
                      const isCorrect = a.isCorrect;
                      return (
                        <div
                          key={a.id}
                          className={cn(
                            'rounded-lg border px-4 py-2 text-sm',
                            isCorrect && 'border-success bg-success/10',
                            picked && !isCorrect && 'border-destructive bg-destructive/5',
                            !picked && !isCorrect && 'opacity-70'
                          )}
                        >
                          <span className="prose-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(a.textHtml) }} />
                          {isCorrect && <span className="ml-2 text-success">✓</span>}
                          {picked && !isCorrect && <span className="ml-2 text-destructive">✗</span>}
                        </div>
                      );
                    })}
                  </div>
                  {q.explanationHtml && (
                    <div className="mt-3 text-sm bg-muted/40 rounded-lg p-3 prose-content"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.explanationHtml) }}
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
