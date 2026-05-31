import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { resolveCategoryIcon } from '@/lib/category-icons';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CategoryDialog, CategoryEditButton } from './CategoryDialog';
import { DeleteCategoryButton } from './DeleteCategoryButton';

export default async function AdminCategoriesPage() {
  const cats = await prisma.category.findMany({
    orderBy: { order: 'asc' },
    include: { _count: { select: { programs: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Категории</h1>
        <CategoryDialog />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Название (RU / KK)</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead className="text-right">Программ</TableHead>
            <TableHead className="w-32 text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cats.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                Пока нет категорий. Нажмите «Добавить».
              </TableCell>
            </TableRow>
          )}
          {cats.map((c) => {
            const Icon = resolveCategoryIcon(c.iconKey, c.slug);
            return (
            <TableRow key={c.id}>
              <TableCell className="text-muted-foreground tabular-nums">{c.order}</TableCell>
              <TableCell>
                <Link
                  href={`/admin/categories/${c.slug}`}
                  className="font-medium hover:text-primary flex items-center gap-2 group"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {c.nameRu}
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
                <div className="text-xs text-muted-foreground ml-6">{c.nameKk}</div>
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">{c.slug}</TableCell>
              <TableCell className="text-right tabular-nums">{c._count.programs}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <CategoryEditButton category={c} />
                  <DeleteCategoryButton
                    categoryId={c.id}
                    categoryName={c.nameRu}
                    programCount={c._count.programs}
                  />
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
