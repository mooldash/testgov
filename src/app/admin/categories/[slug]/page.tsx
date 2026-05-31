import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { ContextSidebar } from '@/components/admin/ContextSidebar';
import { Button } from '@/components/ui/button';
import { ProgramDialog } from '../../programs/ProgramDialog';
import { ProgramsTable, type ProgramRow } from '../../programs/ProgramsTable';
import { AttachProgramDialog } from './AttachProgramDialog';
import { detachProgramFromCategoryAction } from '../../actions';

export default async function CategoryProgramsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [category, allCategories, allPrograms] = await Promise.all([
    prisma.category.findUnique({
      where: { slug },
      include: {
        programs: {
          // Demo programs always at the bottom
          orderBy: [{ isDemo: 'asc' }, { order: 'asc' }],
          include: {
            tariffs: { where: { isPublished: true }, select: { priceTenge: true } },
            _count: { select: { modules: true } },
          },
        },
        extraPrograms: {
          orderBy: { order: 'asc' },
          include: {
            program: {
              include: {
                category: { select: { id: true, slug: true, nameRu: true } },
                tariffs: { where: { isPublished: true }, select: { priceTenge: true } },
                _count: { select: { modules: true } },
              },
            },
          },
        },
      },
    }),
    prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: { _count: { select: { programs: true } } },
    }),
    // Pre-load all programs for the "attach existing" picker
    prisma.program.findMany({
      orderBy: [{ categoryId: 'asc' }, { order: 'asc' }],
      include: { category: { select: { nameRu: true } } },
    }),
  ]);
  if (!category) notFound();

  const catOptions = allCategories.map((c) => ({ id: c.id, nameRu: c.nameRu }));

  // Primary programs (own this category as primary)
  const primaryRows: ProgramRow[] = category.programs.map((p) => {
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
      isDemo: p.isDemo,
      isHighlighted: p.isHighlighted,
    };
  });

  // IDs of programs already attached to this category (primary OR secondary)
  const usedIds = new Set<string>([
    ...category.programs.map((p) => p.id),
    ...category.extraPrograms.map((cp) => cp.programId),
  ]);

  // Programs available for attach: not primary in this category, not already attached
  const available = allPrograms
    .filter((p) => !usedIds.has(p.id))
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      nameRu: p.nameRu,
      nameKk: p.nameKk,
      categoryNameRu: p.category.nameRu,
      isDemo: p.isDemo,
    }));

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

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">{category.nameRu}</h1>
            <div className="text-sm text-muted-foreground">
              {category.nameKk} · {category.slug}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AttachProgramDialog categoryId={category.id} available={available} />
            <ProgramDialog categories={catOptions} defaultCategoryId={category.id} />
          </div>
        </div>

        <div>
          <div className="text-sm text-muted-foreground mb-3">
            Основные программы категории ({primaryRows.length})
          </div>
          <ProgramsTable initial={primaryRows} categories={catOptions} showCategoryColumn={false} />
        </div>

        {category.extraPrograms.length > 0 && (
          <div className="space-y-3 pt-6 border-t">
            <div className="text-sm text-muted-foreground">
              Дополнительные привязки ({category.extraPrograms.length}) — программы из других категорий,
              которые показываются также здесь.
            </div>
            <div className="rounded-md border divide-y">
              {category.extraPrograms.map((cp) => {
                const p = cp.program;
                return (
                  <div
                    key={p.id}
                    className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/admin/programs/${p.slug}`}
                        className="font-medium hover:text-primary"
                      >
                        {p.nameRu}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {p.nameKk}
                        {' · '}
                        Основная категория:{' '}
                        <Link
                          href={`/admin/categories/${p.category.slug}`}
                          className="hover:text-foreground underline-offset-2 hover:underline"
                        >
                          {p.category.nameRu}
                        </Link>
                        {' · '}
                        <span className="font-mono">{p.slug}</span>
                      </div>
                    </div>
                    <form action={detachProgramFromCategoryAction}>
                      <input type="hidden" name="categoryId" value={category.id} />
                      <input type="hidden" name="programId" value={p.id} />
                      <Button
                        type="submit"
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Открепить от этой категории"
                      >
                        Открепить
                      </Button>
                    </form>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
