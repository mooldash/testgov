import Link from 'next/link';
import { Plus, Pencil, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@/lib/utils';
import { deleteArticleAction } from '../actions';

export default async function AdminNewsPage() {
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Новости</h1>
        <Link href="/admin/news/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" /> Новая статья
          </Button>
        </Link>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Заголовок (RU)</TableHead>
            <TableHead className="w-44">Slug</TableHead>
            <TableHead className="w-28">Статус</TableHead>
            <TableHead className="w-36">Создана</TableHead>
            <TableHead className="w-36">Опубликована</TableHead>
            <TableHead className="w-32 text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {articles.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                Пока нет статей.
              </TableCell>
            </TableRow>
          )}
          {articles.map((a) => (
            <TableRow key={a.id}>
              <TableCell>
                <Link
                  href={`/admin/news/${a.id}`}
                  className="font-medium hover:text-primary inline-flex items-center gap-1.5"
                >
                  {a.titleRu}
                </Link>
                <div className="text-xs text-muted-foreground">{a.titleKk}</div>
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">{a.slug}</TableCell>
              <TableCell>
                {a.isPublished ? (
                  <Badge variant="success" className="gap-1">
                    <Eye className="h-3 w-3" /> опубликована
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <EyeOff className="h-3 w-3" /> черновик
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatDateTime(a.createdAt, 'ru')}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {a.publishedAt ? formatDateTime(a.publishedAt, 'ru') : '—'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  {a.isPublished && (
                    <a href={`/ru/news/${a.slug}`} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="ghost" title="Открыть на сайте">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  )}
                  <Link href={`/admin/news/${a.id}`}>
                    <Button size="sm" variant="ghost" title="Редактировать">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <form action={deleteArticleAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <Button
                      type="submit"
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      title="Удалить"
                    >
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
