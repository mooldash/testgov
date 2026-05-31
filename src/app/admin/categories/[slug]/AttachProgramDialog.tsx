'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { attachProgramToCategory } from '../../actions';

type ProgramOption = {
  id: string;
  slug: string;
  nameRu: string;
  nameKk: string;
  categoryNameRu: string;
  isDemo: boolean;
};

export function AttachProgramDialog({
  categoryId,
  available,
}: {
  categoryId: string;
  available: ProgramOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return available;
    return available.filter(
      (p) =>
        p.nameRu.toLowerCase().includes(query) ||
        p.nameKk.toLowerCase().includes(query) ||
        p.slug.toLowerCase().includes(query) ||
        p.categoryNameRu.toLowerCase().includes(query)
    );
  }, [q, available]);

  function attach() {
    if (!selectedId) return;
    setError(null);
    startTransition(async () => {
      try {
        await attachProgramToCategory(categoryId, selectedId);
        setOpen(false);
        setSelectedId(null);
        setQ('');
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Не удалось прицепить');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5 mr-1.5" /> Добавить существующую
      </Button>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Добавить существующую программу в категорию</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Поиск по названию, slug или категории…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-8"
              autoFocus
            />
          </div>

          <div className="max-h-80 overflow-y-auto rounded-md border bg-muted/20 divide-y">
            {filtered.length === 0 && (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                {available.length === 0
                  ? 'Нет доступных программ — все уже в этой категории.'
                  : 'Ничего не найдено.'}
              </div>
            )}
            {filtered.map((p) => {
              const isSelected = selectedId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className={
                    'w-full text-left px-3 py-2.5 flex items-start gap-3 transition-colors ' +
                    (isSelected
                      ? 'bg-primary/10'
                      : 'hover:bg-background')
                  }
                >
                  <input
                    type="radio"
                    checked={isSelected}
                    onChange={() => setSelectedId(p.id)}
                    className="mt-1 h-4 w-4 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm leading-tight inline-flex items-center gap-2 flex-wrap">
                      {p.nameRu}
                      {p.isDemo && (
                        <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400 h-5 px-1.5 text-[10px]">
                          ДЕМО
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {p.nameKk}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      Основная категория: <span className="text-foreground/80">{p.categoryNameRu}</span> · <span className="font-mono">{p.slug}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="mt-2 gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Отмена
            </Button>
          </DialogClose>
          <Button type="button" disabled={!selectedId || pending} onClick={attach}>
            {pending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            Прицепить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
