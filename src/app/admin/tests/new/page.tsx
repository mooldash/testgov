import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { TestSettingsForm } from '../[id]/settings/TestSettingsForm';

export default async function NewTestPage({ searchParams }: { searchParams: Promise<{ moduleId?: string }> }) {
  const { moduleId } = await searchParams;
  if (!moduleId) notFound();
  const module = await prisma.module.findUnique({ where: { id: moduleId }, include: { program: true } });
  if (!module) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <div className="text-sm text-muted-foreground">
        <Link href={`/admin/modules/${moduleId}`} className="hover:text-foreground">← {module.program.nameRu} · #{module.order}</Link>
      </div>
      <h1 className="text-2xl font-semibold">Новый тест</h1>
      <Card>
        <CardContent className="pt-6">
          <TestSettingsForm moduleId={moduleId} />
        </CardContent>
      </Card>
    </div>
  );
}
