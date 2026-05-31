import Link from 'next/link';
import { Pencil, FileQuestion } from 'lucide-react';
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
import { deleteTestAction } from '../actions';

export default async function AdminTestsPage() {
  const tests = await prisma.test.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      module: {
        include: {
          programs: {
            include: { program: { select: { slug: true, nameRu: true, category: { select: { nameRu: true } } } } },
            take: 1,
          },
        },
      },
      _count: { select: { questions: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Тесты</h1>
        <p className="text-sm text-muted-foreground">
          Тесты создаются внутри модулей →{' '}
          <Link href="/admin/modules" className="text-primary hover:underline">
            перейти к модулям
          </Link>
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Название</TableHead>
            <TableHead>Язык</TableHead>
            <TableHead>Режим</TableHead>
            <TableHead>Программа</TableHead>
            <TableHead className="text-right">Вопросов</TableHead>
            <TableHead className="w-12 text-center">✓</TableHead>
            <TableHead className="w-40 text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tests.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                Пока нет тестов.
              </TableCell>
            </TableRow>
          )}
          {tests.map((t) => (
            <TableRow key={t.id}>
              <TableCell>
                <Link
                  href={`/admin/tests/${t.id}/settings`}
                  className="font-medium hover:text-primary"
                >
                  {t.title}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="font-mono text-xs">{t.locale}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">{t.mode}</Badge>
              </TableCell>
              <TableCell>
                {t.module.programs[0] ? (
                  <>
                    <Link
                      href={`/admin/programs/${t.module.programs[0].program.slug}`}
                      className="text-xs text-muted-foreground hover:text-primary"
                    >
                      {t.module.programs[0].program.nameRu}
                    </Link>
                    <div className="text-[10px] text-muted-foreground">
                      {t.module.programs[0].program.category?.nameRu ?? '— без категории —'}
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground italic">не привязан</span>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">{t._count.questions}</TableCell>
              <TableCell className="text-center">
                {t.isPublished ? (
                  <span className="text-emerald-600">●</span>
                ) : (
                  <span className="text-muted-foreground">○</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Link href={`/admin/tests/${t.id}/questions`}>
                    <Button size="sm" variant="ghost" title="Вопросы">
                      <FileQuestion className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Link href={`/admin/tests/${t.id}/settings`}>
                    <Button size="sm" variant="ghost" title="Настройки">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <form action={deleteTestAction}>
                    <input type="hidden" name="id" value={t.id} />
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
