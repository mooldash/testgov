import Link from 'next/link';
import { ChevronRight, BookOpen, Target, Copy } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { deleteModuleAction, duplicateModuleAction } from '../actions';
import { ModuleDialog, ModuleEditButton } from './ModuleDialog';
import { LocaleToggle } from './LocaleToggle';

const TYPE_LABEL_RU = {
  LAW: 'Материал',
  TEST_COLLECTION: 'Тест',
} as const;

export default async function AdminModulesPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const locale: 'RU' | 'KK' = lang === 'KK' ? 'KK' : 'RU';

  const modules = await prisma.module.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      contents: { where: { locale }, select: { title: true } },
      tests: { where: { locale }, select: { title: true } },
      programs: { include: { program: { select: { slug: true, nameRu: true, nameKk: true } } } },
      _count: { select: { tests: true, contents: true, programs: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold">Модули</h1>
        <div className="flex items-center gap-3">
          <LocaleToggle current={locale} />
          <ModuleDialog />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Название</TableHead>
            <TableHead className="w-28">Тип</TableHead>
            <TableHead className="w-44 whitespace-nowrap">В программах</TableHead>
            <TableHead className="w-24 text-right">Тестов</TableHead>
            <TableHead className="w-28 text-right">Материалов</TableHead>
            <TableHead className="w-12 text-center">✓</TableHead>
            <TableHead className="w-40 text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {modules.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                Пока нет модулей.
              </TableCell>
            </TableRow>
          )}
          {modules.map((m) => {
            const Icon = m.type === 'LAW' ? BookOpen : Target;
            const displayTitle =
              m.type === 'LAW'
                ? m.contents[0]?.title ?? (locale === 'KK' ? 'Оқу материалы' : 'Учебный материал')
                : m.tests[0]?.title ?? (locale === 'KK' ? 'Тесттер жинағы' : 'Сборник тестов');
            return (
              <TableRow key={m.id}>
                <TableCell>
                  <Link
                    href={`/admin/modules/${m.id}`}
                    className="font-medium hover:text-primary inline-flex items-center gap-1.5 group"
                  >
                    {displayTitle}
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={m.type === 'LAW' ? 'secondary' : 'outline'}
                    className="gap-1 font-normal"
                  >
                    <Icon className="h-3 w-3" />
                    {TYPE_LABEL_RU[m.type]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {m._count.programs}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {m._count.tests}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {m._count.contents}
                </TableCell>
                <TableCell className="text-center">
                  {m.isPublished ? (
                    <span className="text-emerald-600">●</span>
                  ) : (
                    <span className="text-muted-foreground">○</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <ModuleEditButton module={m} />
                    <form action={duplicateModuleAction}>
                      <input type="hidden" name="id" value={m.id} />
                      <Button
                        type="submit"
                        size="sm"
                        variant="ghost"
                        title="Дублировать модуль"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </form>
                    <form action={deleteModuleAction}>
                      <input type="hidden" name="id" value={m.id} />
                      <Button
                        type="submit"
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        ✕
                      </Button>
                    </form>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
