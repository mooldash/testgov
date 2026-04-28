import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { sanitizeHtml } from '@/lib/sanitize';
import { QuestionBuilder } from './QuestionBuilder';
import { DeleteQuestionButton } from './DeleteQuestionButton';

export default async function QuestionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const test = await prisma.test.findUnique({
    where: { id },
    include: {
      module: { include: { program: true } },
      questions: { include: { answers: { orderBy: { order: 'asc' } } }, orderBy: { order: 'asc' } },
    },
  });
  if (!test) notFound();

  return (
    <div className="max-w-4xl space-y-6">
      <div className="text-sm text-muted-foreground">
        <Link href={`/admin/modules/${test.moduleId}`} className="hover:text-foreground">
          ← {test.module.program.nameRu} · #{test.module.order}
        </Link>
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Вопросы — {test.title}</h1>
        <Link href={`/admin/tests/${test.id}/settings`} className="text-sm text-primary hover:underline">Настройки →</Link>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Новый вопрос</CardTitle></CardHeader>
        <CardContent><QuestionBuilder testId={test.id} /></CardContent>
      </Card>

      <div className="space-y-4">
        {test.questions.map((q, idx) => (
          <Card key={q.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm text-muted-foreground">Вопрос {idx + 1}</CardTitle>
              <DeleteQuestionButton id={q.id} testId={test.id} />
            </CardHeader>
            <CardContent>
              <QuestionBuilder
                testId={test.id}
                initial={{
                  id: q.id,
                  textHtml: sanitizeHtml(q.textHtml),
                  explanationHtml: q.explanationHtml ? sanitizeHtml(q.explanationHtml) : '',
                  mediaUrl: q.mediaUrl ?? '',
                  youtubeId: q.youtubeId ?? '',
                  order: q.order,
                  answers: q.answers.map((a) => ({
                    id: a.id, textHtml: sanitizeHtml(a.textHtml), isCorrect: a.isCorrect,
                  })),
                }}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
