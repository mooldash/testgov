import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { deleteCategoryAction } from '../actions';
import { CategoryDialog, CategoryEditButton } from './CategoryDialog';

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
          {cats.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="text-muted-foreground tabular-nums">{c.order}</TableCell>
              <TableCell>
                <Link
                  href={`/admin/categories/${c.slug}`}
                  className="font-medium hover:text-primary flex items-center gap-1.5 group"
                >
                  {c.nameRu}
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
                <div className="text-xs text-muted-foreground">{c.nameKk}</div>
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">{c.slug}</TableCell>
              <TableCell className="text-right tabular-nums">{c._count.programs}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <CategoryEditButton category={c} />
                  <form action={deleteCategoryAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <Button type="submit" size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      ✕
                    </Button>
                  </form>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
