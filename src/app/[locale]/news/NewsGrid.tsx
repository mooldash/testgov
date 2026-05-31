'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, ChevronRight, Grid2x2, Grid3x3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Article = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverUrl: string | null;
  publishedAt: Date | null;
};

export function NewsGrid({
  articles,
  locale,
}: {
  articles: Article[];
  locale: 'ru' | 'kk';
}) {
  const [cols, setCols] = useState<2 | 3>(3);
  const isKk = locale === 'kk';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end gap-1">
        <span className="text-xs text-muted-foreground mr-2 hidden sm:inline">
          {isKk ? 'Көрсету:' : 'Вид:'}
        </span>
        <button
          type="button"
          onClick={() => setCols(2)}
          aria-label="2 колонки"
          className={cn(
            'h-9 w-9 inline-flex items-center justify-center rounded-md border transition-colors',
            cols === 2
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Grid2x2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setCols(3)}
          aria-label="3 колонки"
          className={cn(
            'h-9 w-9 inline-flex items-center justify-center rounded-md border transition-colors',
            cols === 3
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <Grid3x3 className="h-4 w-4" />
        </button>
      </div>

      <div
        className={cn(
          'grid gap-5 sm:grid-cols-2',
          cols === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'
        )}
      >
        {articles.map((a) => (
          <Link key={a.id} href={`/${locale}/news/${a.slug}`} className="block group">
            <Card className="overflow-hidden h-full transition-colors group-hover:border-primary/60 flex flex-col">
              {a.coverUrl && (
                <div className="aspect-[16/10] overflow-hidden bg-muted">
                  <img
                    src={a.coverUrl}
                    alt={a.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              )}
              <CardContent className="pt-5 px-5 pb-5 flex-1 flex flex-col">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                  <Calendar className="h-3.5 w-3.5" />
                  {a.publishedAt
                    ? new Intl.DateTimeFormat(isKk ? 'kk-KZ' : 'ru-RU', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        timeZone: 'Asia/Almaty',
                      }).format(new Date(a.publishedAt))
                    : '—'}
                </div>
                <h2 className="text-base font-semibold group-hover:text-primary inline-flex items-start gap-1 leading-snug">
                  <span className="flex-1">{a.title}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5" />
                </h2>
                {a.excerpt && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{a.excerpt}</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
