import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { TestSettingsForm } from './TestSettingsForm';

export default async function TestSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const test = await prisma.test.findUnique({
    where: { id },
    include: { module: { include: { contents: { where: { locale: 'RU' }, select: { title: true } } } } },
  });
  if (!test) notFound();

  const moduleLabel =
    test.module.contents[0]?.title ?? test.title;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="text-sm text-muted-foreground">
        <Link href={`/admin/modules/${test.moduleId}`} className="hover:text-foreground">
          ← {moduleLabel}
        </Link>
      </div>
      <h1 className="text-2xl font-semibold">Настройки теста</h1>
      <Card>
        <CardContent className="pt-6">
          <TestSettingsForm test={test} moduleId={test.moduleId} />
        </CardContent>
      </Card>
    </div>
  );
}
