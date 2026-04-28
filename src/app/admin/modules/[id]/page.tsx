import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ModuleContentEditor } from './ModuleContentEditor';
import { TestRow } from './TestRow';

export default async function ModuleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const module = await prisma.module.findUnique({
    where: { id },
    include: {
      program: { include: { category: true } },
      contents: true,
      tests: { include: { _count: { select: { questions: true } } } },
    },
  });
  if (!module) notFound();

  const ru = module.contents.find((c) => c.locale === 'RU');
  const kk = module.contents.find((c) => c.locale === 'KK');

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="text-sm text-muted-foreground">
        <Link href="/admin/modules" className="hover:text-foreground">Модули</Link> /{' '}
        <span>{module.program.nameRu} #{module.order}</span>
      </div>
      <h1 className="text-2xl font-semibold">{module.program.nameRu} · Модуль #{module.order} · {module.type}</h1>

      {module.type === 'LAW' && (
        <Card>
          <CardHeader><CardTitle className="text-base">Учебный материал (RU/KK)</CardTitle></CardHeader>
          <CardContent>
            <ModuleContentEditor
              moduleId={module.id}
              ru={{ title: ru?.title ?? '', bodyHtml: ru?.bodyHtml ?? '' }}
              kk={{ title: kk?.title ?? '', bodyHtml: kk?.bodyHtml ?? '' }}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Тесты</CardTitle>
          <Link href={`/admin/tests/new?moduleId=${module.id}`}>
            <Button size="sm">+ Новый тест</Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {module.tests.length === 0 && <p className="text-sm text-muted-foreground">Тестов нет</p>}
          {module.tests.map((t) => (
            <TestRow key={t.id} id={t.id} title={t.title} locale={t.locale} mode={t.mode} questionsCount={t._count.questions} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
