import { Star, Check, Eye, Trash2 } from 'lucide-react';
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
import { formatDateTime } from '@/lib/utils';
import { setReviewPublishedAction, deleteReviewAction } from '../actions';

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const filter = status === 'published' ? true : status === 'pending' ? false : undefined;

  const reviews = await prisma.review.findMany({
    where: filter === undefined ? {} : { isPublished: filter },
    include: {
      user: { select: { name: true, email: true } },
      program: { select: { slug: true, nameRu: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const [pendingCount, publishedCount] = await Promise.all([
    prisma.review.count({ where: { isPublished: false } }),
    prisma.review.count({ where: { isPublished: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold">Отзывы</h1>
        <div className="flex gap-1 text-sm">
          <FilterPill label={`Все (${pendingCount + publishedCount})`} href="/admin/reviews" active={filter === undefined} />
          <FilterPill label={`На модерации (${pendingCount})`} href="/admin/reviews?status=pending" active={filter === false} />
          <FilterPill label={`Опубликовано (${publishedCount})`} href="/admin/reviews?status=published" active={filter === true} />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">Оценка</TableHead>
            <TableHead>Отзыв</TableHead>
            <TableHead className="w-44">Пользователь</TableHead>
            <TableHead className="w-44">Программа</TableHead>
            <TableHead className="w-36">Когда</TableHead>
            <TableHead className="w-28">Статус</TableHead>
            <TableHead className="w-32 text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviews.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                Пока нет отзывов.
              </TableCell>
            </TableRow>
          )}
          {reviews.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <div className="inline-flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={
                        'h-3.5 w-3.5 ' +
                        (n <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')
                      }
                    />
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-md text-sm whitespace-pre-wrap line-clamp-3">{r.text}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm font-medium">{r.user.name || '—'}</div>
                <div className="text-xs text-muted-foreground">{r.user.email}</div>
              </TableCell>
              <TableCell>
                <a href={`/ru/programs/${r.program.slug}`} target="_blank" rel="noopener noreferrer" className="text-sm hover:text-primary">
                  {r.program.nameRu}
                </a>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{formatDateTime(r.createdAt, 'ru')}</TableCell>
              <TableCell>
                {r.isPublished ? (
                  <Badge variant="success" className="gap-1">
                    <Check className="h-3 w-3" /> опубликован
                  </Badge>
                ) : (
                  <Badge variant="secondary">модерация</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <form action={setReviewPublishedAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="isPublished" value={r.isPublished ? 'false' : 'true'} />
                    <Button
                      type="submit"
                      size="sm"
                      variant="ghost"
                      title={r.isPublished ? 'Снять с публикации' : 'Опубликовать'}
                    >
                      {r.isPublished ? <Eye className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                    </Button>
                  </form>
                  <form action={deleteReviewAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <Button
                      type="submit"
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      title="Удалить"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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

function FilterPill({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <a
      href={href}
      className={
        'inline-flex items-center px-3 h-8 rounded-md border transition-colors ' +
        (active ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted')
      }
    >
      {label}
    </a>
  );
}
