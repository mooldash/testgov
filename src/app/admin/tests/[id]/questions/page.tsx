import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Plus, CheckCircle2, AlertCircle, FileQuestion } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { sanitizeHtml } from '@/lib/sanitize';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { InlineQuestionEditor } from './InlineQuestionEditor';

function htmlToText(html: string, max = 200): string {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? text.slice(0, max) + '…' : text;
}

export default async function QuestionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ question?: string }>;
}) {
  const { id } = await params;
  const { question: selectedParam } = await searchParams;

  const test = await prisma.test.findUnique({
    where: { id },
    include: {
      module: {
        include: {
          programs: {
            include: { program: { include: { category: true } } },
            take: 1,
          },
        },
      },
      questions: {
        orderBy: { order: 'asc' },
        include: { answers: { select: { isCorrect: true } } },
      },
    },
  });
  if (!test) notFound();
  const firstProg = test.module.programs[0]?.program;

  const mode: 'new' | 'edit' | 'none' =
    selectedParam === 'new'
      ? 'new'
      : selectedParam && test.questions.some((q) => q.id === selectedParam)
        ? 'edit'
        : 'none';

  let initial = undefined;
  if (mode === 'edit') {
    const full = await prisma.question.findUnique({
      where: { id: selectedParam! },
      include: { answers: { orderBy: { order: 'asc' } } },
    });
    if (full) {
      initial = {
        id: full.id,
        textHtml: sanitizeHtml(full.textHtml),
        explanationHtml: full.explanationHtml ? sanitizeHtml(full.explanationHtml) : '',
        mediaUrl: full.mediaUrl ?? '',
        youtubeId: full.youtubeId ?? '',
        order: full.order,
        answers: full.answers.map((a) => ({
          id: a.id,
          textHtml: sanitizeHtml(a.textHtml),
          isCorrect: a.isCorrect,
        })),
      };
    }
  }

  const baseHref = `/admin/tests/${test.id}/questions`;

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground flex items-center gap-1 flex-wrap">
        <Link href="/admin/categories" className="hover:text-foreground">Категории</Link>
        {firstProg && (
          <>
            <ChevronRight className="h-3 w-3" />
            {firstProg.category ? (
              <Link
                href={`/admin/categories/${firstProg.category.slug}`}
                className="hover:text-foreground"
              >
                {firstProg.category.nameRu}
              </Link>
            ) : (
              <span className="italic">без основной</span>
            )}
            <ChevronRight className="h-3 w-3" />
            <Link
              href={`/admin/programs/${firstProg.slug}`}
              className="hover:text-foreground"
            >
              {firstProg.nameRu}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3" />
        <Link href={`/admin/modules/${test.moduleId}`} className="hover:text-foreground">
          Модуль
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Вопросы</span>
      </div>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">{test.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Всего вопросов: {test.questions.length}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/tests/${test.id}/settings`}>
            <Button variant="outline" size="sm">Настройки теста</Button>
          </Link>
          <Link href={`${baseHref}?question=new`}>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Новый вопрос
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT: questions table */}
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 py-2">#</TableHead>
                <TableHead className="py-2">Текст вопроса</TableHead>
                <TableHead className="w-16 text-center py-2">Отв.</TableHead>
                <TableHead className="w-12 text-center py-2"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {test.questions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                    Вопросов пока нет.
                  </TableCell>
                </TableRow>
              )}
              {test.questions.map((q, idx) => {
                const hasCorrect = q.answers.some((a) => a.isCorrect);
                const active = selectedParam === q.id;
                return (
                  <TableRow
                    key={q.id}
                    className={cn(active && 'bg-primary/10 hover:bg-primary/10')}
                  >
                    <TableCell className="py-1.5 text-muted-foreground tabular-nums text-xs">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Link
                        href={`${baseHref}?question=${q.id}`}
                        className={cn(
                          'block text-sm line-clamp-2 hover:text-primary leading-snug',
                          active && 'text-primary font-medium'
                        )}
                      >
                        {htmlToText(q.textHtml)}
                      </Link>
                    </TableCell>
                    <TableCell className="py-1.5 text-center tabular-nums text-xs text-muted-foreground">
                      {q.answers.length}
                    </TableCell>
                    <TableCell className="py-1.5 text-center">
                      {hasCorrect ? (
                        <CheckCircle2 className="inline h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <AlertCircle className="inline h-3.5 w-3.5 text-amber-500" />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* RIGHT: editor panel */}
        <div className="lg:sticky lg:top-4 self-start">
          {mode === 'none' && (
            <Card>
              <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-4">
                  <FileQuestion className="h-6 w-6" />
                </div>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Выберите вопрос слева, чтобы открыть редактор, или нажмите «Новый вопрос» в правом верхнем углу.
                </p>
              </CardContent>
            </Card>
          )}
          {(mode === 'new' || mode === 'edit') && (
            <InlineQuestionEditor testId={test.id} mode={mode} initial={initial} />
          )}
        </div>
      </div>
    </div>
  );
}
