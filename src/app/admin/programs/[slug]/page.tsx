import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { ContextSidebar } from '@/components/admin/ContextSidebar';
import { LocaleToggle } from '../../modules/LocaleToggle';
import { ModuleDialog } from '../../modules/ModuleDialog';
import { ModulesTable, type ModuleRow } from './ModulesTable';
import { AttachModuleDialog, type AttachableModule } from './AttachModuleDialog';

export default async function ProgramModulesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const { lang } = await searchParams;
  const locale: 'RU' | 'KK' = lang === 'KK' ? 'KK' : 'RU';

  const program = await prisma.program.findUnique({
    where: { slug },
    include: {
      category: true,
      modules: {
        orderBy: { order: 'asc' },
        include: {
          module: {
            include: {
              contents: { where: { locale }, select: { title: true } },
              tests: { where: { locale }, select: { title: true } },
              _count: { select: { tests: true, contents: true } },
            },
          },
        },
      },
    },
  });
  if (!program) notFound();

  const [siblings, attachableRaw] = await Promise.all([
    prisma.program.findMany({
      where: { categoryId: program.categoryId },
      orderBy: { order: 'asc' },
      include: { _count: { select: { modules: true } } },
    }),
    prisma.module.findMany({
      where: {
        NOT: { programs: { some: { programId: program.id } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        contents: { where: { locale }, select: { title: true } },
        tests: { where: { locale }, select: { title: true } },
        _count: { select: { programs: true } },
      },
    }),
  ]);

  const attachable: AttachableModule[] = attachableRaw.map((m) => {
    const title =
      m.type === 'LAW'
        ? m.contents[0]?.title ?? 'Учебный материал'
        : m.tests[0]?.title ?? 'Сборник тестов';
    return { id: m.id, type: m.type, title, programCount: m._count.programs };
  });

  const moduleRows: ModuleRow[] = program.modules.map((pm) => {
    const m = pm.module;
    const displayTitle =
      m.type === 'LAW'
        ? m.contents[0]?.title ??
          (locale === 'KK' ? 'Оқу материалы' : 'Учебный материал')
        : m.tests[0]?.title ??
          (locale === 'KK' ? 'Тесттер жинағы' : 'Сборник тестов');
    return {
      id: m.id,
      type: m.type,
      order: pm.order,
      isPublished: m.isPublished,
      displayTitle,
      testsCount: m._count.tests,
      contentsCount: m._count.contents,
    };
  });

  return (
    <div className="flex gap-8">
      <ContextSidebar
        title="Программы категории"
        backHref={`/admin/categories/${program.category.slug}`}
        backLabel={program.category.nameRu}
        items={siblings.map((p) => ({
          href: `/admin/programs/${p.slug}`,
          label: p.nameRu,
          sublabel: `${p._count.modules}`,
          active: p.slug === slug,
        }))}
      />

      <div className="flex-1 min-w-0 space-y-6">
        <div className="text-sm text-muted-foreground flex items-center gap-1 flex-wrap">
          <Link href="/admin/categories" className="hover:text-foreground">Категории</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href={`/admin/categories/${program.category.slug}`} className="hover:text-foreground">
            {program.category.nameRu}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{program.nameRu}</span>
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">{program.nameRu}</h1>
            <div className="text-sm text-muted-foreground">
              {program.nameKk} · {program.slug}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <LocaleToggle current={locale} />
            <AttachModuleDialog programId={program.id} available={attachable} />
            <ModuleDialog attachToProgramId={program.id} />
          </div>
        </div>

        <ModulesTable initial={moduleRows} programId={program.id} />
      </div>
    </div>
  );
}
