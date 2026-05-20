import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { TestSettingsForm } from '../[id]/settings/TestSettingsForm';

export default async function NewTestPage({
  searchParams,
}: {
  searchParams: Promise<{ moduleId?: string; locale?: string }>;
}) {
  const { moduleId, locale } = await searchParams;
  if (!moduleId) notFound();
  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    include: { contents: { where: { locale: 'RU' }, select: { title: true } } },
  });
  if (!module) notFound();

  const defaultLocale = locale === 'KK' ? 'KK' : locale === 'RU' ? 'RU' : undefined;
  const moduleLabel =
    module.contents[0]?.title ?? (module.type === 'LAW' ? 'Учебный материал' : 'Сборник тестов');

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="text-sm text-muted-foreground">
        <Link href={`/admin/modules/${moduleId}`} className="hover:text-foreground">
          ← {moduleLabel}
        </Link>
      </div>
      <h1 className="text-2xl font-semibold">Новый тест</h1>
      <Card>
        <CardContent className="pt-6">
          <TestSettingsForm moduleId={moduleId} defaultLocale={defaultLocale} />
        </CardContent>
      </Card>
    </div>
  );
}
