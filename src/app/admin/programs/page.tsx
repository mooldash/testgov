import { prisma } from '@/lib/prisma';
import { ProgramDialog } from './ProgramDialog';
import { ProgramsTable, type ProgramRow } from './ProgramsTable';

export default async function AdminProgramsPage() {
  const [programs, categories] = await Promise.all([
    prisma.program.findMany({
      // Demo programs always at the bottom of each category
      orderBy: [{ categoryId: 'asc' }, { isDemo: 'asc' }, { order: 'asc' }],
      include: {
        category: true,
        tariffs: { where: { isPublished: true }, select: { priceTenge: true } },
        _count: { select: { modules: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { order: 'asc' } }),
  ]);
  const catOptions = categories.map((c) => ({ id: c.id, nameRu: c.nameRu }));

  const rows: ProgramRow[] = programs.map((p) => {
    const prices = p.tariffs.map((t) => t.priceTenge);
    return {
      id: p.id,
      slug: p.slug,
      nameRu: p.nameRu,
      nameKk: p.nameKk,
      descriptionRu: p.descriptionRu,
      descriptionKk: p.descriptionKk,
      categoryId: p.categoryId,
      categoryNameRu: p.category?.nameRu ?? '— без основной —',
      categorySlug: p.category?.slug ?? null,
      priceMin: prices.length ? Math.min(...prices) : null,
      priceMax: prices.length ? Math.max(...prices) : null,
      tariffCount: prices.length,
      moduleCount: p._count.modules,
      isPublished: p.isPublished,
      isDemo: p.isDemo,
      isHighlighted: p.isHighlighted,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Программы</h1>
        <ProgramDialog categories={catOptions} />
      </div>

      <ProgramsTable initial={rows} categories={catOptions} showCategoryColumn />
    </div>
  );
}
