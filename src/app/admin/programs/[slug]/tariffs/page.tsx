import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { TariffsTable } from './TariffsTable';

export default async function ProgramTariffsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const program = await prisma.program.findUnique({
    where: { slug },
    include: {
      category: true,
      tariffs: { orderBy: { order: 'asc' } },
    },
  });
  if (!program) notFound();

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground flex items-center gap-1 flex-wrap">
        <Link href="/admin/categories" className="hover:text-foreground">
          Категории
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          href={`/admin/categories/${program.category.slug}`}
          className="hover:text-foreground"
        >
          {program.category.nameRu}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/admin/programs/${program.slug}`} className="hover:text-foreground">
          {program.nameRu}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Тарифы</span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold">Тарифы программы</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {program.nameRu} · правки сохраняются автоматически
        </p>
      </div>

      <TariffsTable programId={program.id} initial={program.tariffs} />
    </div>
  );
}
