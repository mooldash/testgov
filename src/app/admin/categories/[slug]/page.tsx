import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { ContextSidebar } from '@/components/admin/ContextSidebar';
import { ProgramDialog } from '../../programs/ProgramDialog';
import { ProgramsTable, type ProgramRow } from '../../programs/ProgramsTable';

export default async function CategoryProgramsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [category, allCategories] = await Promise.all([
    prisma.category.findUnique({
      where: { slug },
      include: {
        programs: {
          orderBy: { order: 'asc' },
          include: {
            tariffs: { where: { isPublished: true }, select: { priceTenge: true } },
            _count: { select: { modules: true } },
          },
        },
      },
    }),
    prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: { _count: { select: { programs: true } } },
    }),
  ]);
  if (!category) notFound();

  const catOptions = allCategories.map((c) => ({ id: c.id, nameRu: c.nameRu }));

  const rows: ProgramRow[] = category.programs.map((p) => {
    const prices = p.tariffs.map((t) => t.priceTenge);
    return {
      id: p.id,
      slug: p.slug,
      nameRu: p.nameRu,
      nameKk: p.nameKk,
      descriptionRu: p.descriptionRu,
      descriptionKk: p.descriptionKk,
      categoryId: category.id,
      categoryNameRu: category.nameRu,
      categorySlug: category.slug,
      priceMin: prices.length ? Math.min(...prices) : null,
      priceMax: prices.length ? Math.max(...prices) : null,
      tariffCount: prices.length,
      moduleCount: p._count.modules,
      isPublished: p.isPublished,
    };
  });

  return (
    <div className="flex gap-8">
      <ContextSidebar
        title="Категории"
        backHref="/admin/categories"
        backLabel="Все категории"
        items={allCategories.map((c) => ({
          href: `/admin/categories/${c.slug}`,
          label: c.nameRu,
          sublabel: `${c._count.programs}`,
          active: c.slug === slug,
        }))}
      />

      <div className="flex-1 min-w-0 space-y-6">
        <div className="text-sm text-muted-foreground flex items-center gap-1">
          <Link href="/admin/categories" className="hover:text-foreground">Категории</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{category.nameRu}</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{category.nameRu}</h1>
            <div className="text-sm text-muted-foreground">
              {category.nameKk} · {category.slug}
            </div>
          </div>
          <ProgramDialog categories={catOptions} defaultCategoryId={category.id} />
        </div>

        <ProgramsTable initial={rows} categories={catOptions} showCategoryColumn={false} />
      </div>
    </div>
  );
}
