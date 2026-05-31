'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, GripVertical, Tags, PlayCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  deleteProgramAction,
  reorderPrograms,
  setProgramPublished,
} from '../actions';
import { ProgramEditButton } from './ProgramDialog';
import { cn } from '@/lib/utils';

export type ProgramRow = {
  id: string;
  slug: string;
  nameRu: string;
  nameKk: string;
  descriptionRu: string | null;
  descriptionKk: string | null;
  categoryId: string | null;
  categoryNameRu: string;
  categorySlug: string | null;
  priceMin: number | null;
  priceMax: number | null;
  tariffCount: number;
  moduleCount: number;
  isPublished: boolean;
  isDemo?: boolean;
  isHighlighted?: boolean;
};

type CategoryOption = { id: string; nameRu: string };

function fmtRange(min: number | null, max: number | null): string {
  if (min == null || max == null) return '—';
  if (min === max) return `${min.toLocaleString('ru-RU')} ₸`;
  return `${min.toLocaleString('ru-RU')} – ${max.toLocaleString('ru-RU')} ₸`;
}

function pluralTariffs(n: number): string {
  if (n === 1) return 'тариф';
  if (n >= 2 && n <= 4) return 'тарифа';
  return 'тарифов';
}

export function ProgramsTable({
  initial,
  categories,
  showCategoryColumn = true,
}: {
  initial: ProgramRow[];
  categories: CategoryOption[];
  showCategoryColumn?: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Sync local state when server re-renders with new data
  const initialKey = initial.map((r) => `${r.id}:${r.isPublished}`).join(',');
  useEffect(() => {
    setRows(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey]);

  function onDragStart(id: string) {
    setDragId(id);
  }
  function onDragOver(e: React.DragEvent, overRowId: string) {
    e.preventDefault();
    if (overRowId !== overId) setOverId(overRowId);
  }
  function onDragEnd() {
    setDragId(null);
    setOverId(null);
  }
  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) {
      onDragEnd();
      return;
    }
    const src = rows.find((r) => r.id === dragId);
    const tgt = rows.find((r) => r.id === targetId);
    if (!src || !tgt) {
      onDragEnd();
      return;
    }
    // Only allow reorder within the same category, and skip if either side has no primary
    if (!src.categoryId || src.categoryId !== tgt.categoryId) {
      onDragEnd();
      return;
    }
    const srcCatId = src.categoryId;
    const next = [...rows];
    const fromIdx = next.findIndex((r) => r.id === dragId);
    const toIdx = next.findIndex((r) => r.id === targetId);
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setRows(next);
    onDragEnd();

    // Send the new order of programs WITHIN this category to the server
    const orderedIdsInCategory = next
      .filter((r) => r.categoryId === srcCatId)
      .map((r) => r.id);
    startTransition(async () => {
      await reorderPrograms(srcCatId, orderedIdsInCategory);
      router.refresh();
    });
  }

  function togglePublished(id: string, value: boolean) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, isPublished: value } : r)));
    startTransition(async () => {
      await setProgramPublished(id, value);
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8 p-0" />
          <TableHead>Название</TableHead>
          {showCategoryColumn && <TableHead>Категория</TableHead>}
          <TableHead>Slug</TableHead>
          <TableHead className="text-right whitespace-nowrap">Цена (тарифы)</TableHead>
          <TableHead className="w-24 text-right">Модулей</TableHead>
          <TableHead className="w-24 text-center">Статус</TableHead>
          <TableHead className="w-44 text-right">Действия</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 && (
          <TableRow>
            <TableCell
              colSpan={showCategoryColumn ? 8 : 7}
              className="text-center text-muted-foreground py-8"
            >
              Программ нет.
            </TableCell>
          </TableRow>
        )}
        {rows.map((p) => {
          const isDragging = dragId === p.id;
          const isOver =
            overId === p.id &&
            dragId &&
            dragId !== p.id &&
            rows.find((r) => r.id === dragId)?.categoryId === p.categoryId;
          return (
            <TableRow
              key={p.id}
              draggable
              onDragStart={() => onDragStart(p.id)}
              onDragOver={(e) => onDragOver(e, p.id)}
              onDrop={() => onDrop(p.id)}
              onDragEnd={onDragEnd}
              className={cn(
                'cursor-default select-none',
                isDragging && 'opacity-40',
                isOver && 'outline outline-2 outline-primary -outline-offset-2'
              )}
            >
              <TableCell className="p-0 text-center">
                <span
                  className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                  title="Перетащите для изменения порядка (в пределах категории)"
                >
                  <GripVertical className="h-4 w-4" />
                </span>
              </TableCell>
              <TableCell>
                <Link
                  href={`/admin/programs/${p.slug}`}
                  className="font-medium hover:text-primary inline-flex items-center gap-1.5 group"
                >
                  {p.nameRu}
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
                <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                  {p.nameKk}
                  {p.isDemo && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                      <PlayCircle className="h-2.5 w-2.5" /> ДЕМО
                    </span>
                  )}
                  {p.isHighlighted && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                      <Star className="h-2.5 w-2.5" /> РЕКОМЕНДУЕМ
                    </span>
                  )}
                </div>
              </TableCell>
              {showCategoryColumn && (
                <TableCell>
                  {p.categorySlug ? (
                    <Link
                      href={`/admin/categories/${p.categorySlug}`}
                      className="text-xs text-muted-foreground hover:text-primary"
                    >
                      {p.categoryNameRu}
                    </Link>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">{p.categoryNameRu}</span>
                  )}
                </TableCell>
              )}
              <TableCell className="font-mono text-xs text-muted-foreground">{p.slug}</TableCell>
              <TableCell className="text-right tabular-nums whitespace-nowrap">
                <span className={p.tariffCount === 0 ? 'text-muted-foreground' : ''}>
                  {fmtRange(p.priceMin, p.priceMax)}
                </span>
                {p.tariffCount > 0 && (
                  <div className="text-[10px] text-muted-foreground font-normal">
                    {p.tariffCount} {pluralTariffs(p.tariffCount)}
                  </div>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">{p.moduleCount}</TableCell>
              <TableCell className="text-center">
                <Switch
                  checked={p.isPublished}
                  onCheckedChange={(v) => togglePublished(p.id, v)}
                  aria-label={p.isPublished ? 'Опубликовано' : 'Черновик'}
                />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1 items-center">
                  <Link href={`/admin/programs/${p.slug}/tariffs`}>
                    <Button size="sm" variant="outline">
                      <Tags className="h-3.5 w-3.5 mr-1.5" />
                      Тарифы
                    </Button>
                  </Link>
                  <ProgramEditButton
                    program={{
                      id: p.id,
                      categoryId: p.categoryId,
                      slug: p.slug,
                      nameRu: p.nameRu,
                      nameKk: p.nameKk,
                      descriptionRu: p.descriptionRu,
                      descriptionKk: p.descriptionKk,
                      isDemo: p.isDemo,
                      isHighlighted: p.isHighlighted,
                    }}
                    categories={categories}
                  />
                  <form action={deleteProgramAction}>
                    <input type="hidden" name="id" value={p.id} />
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
  );
}
