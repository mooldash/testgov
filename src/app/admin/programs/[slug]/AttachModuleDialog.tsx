'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Link2, Search, BookOpen, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { attachModuleToProgram } from '@/app/admin/actions';

export type AttachableModule = {
  id: string;
  type: 'LAW' | 'TEST_COLLECTION';
  title: string;
  programCount: number;
};

export function AttachModuleDialog({
  programId,
  available,
}: {
  programId: string;
  available: AttachableModule[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, start] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available.slice(0, 50);
    return available
      .filter((m) => m.title.toLowerCase().includes(q))
      .slice(0, 50);
  }, [available, query]);

  function attach(moduleId: string) {
    setPendingId(moduleId);
    start(async () => {
      await attachModuleToProgram(programId, moduleId);
      setPendingId(null);
      setOpen(false);
      setQuery('');
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setQuery('');
      }}
    >
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Link2 className="h-4 w-4 mr-1.5" />
        Привязать существующий
      </Button>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Привязать существующий модуль</DialogTitle>
        </DialogHeader>

        {available.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Все модули уже привязаны к этой программе. Сначала создайте новый или открепите от другой программы.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию"
                className="pl-8"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>
            <div className="border rounded-md max-h-96 overflow-y-auto divide-y">
              {filtered.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Ничего не найдено
                </div>
              ) : (
                filtered.map((m) => {
                  const Icon = m.type === 'LAW' ? BookOpen : Target;
                  const typeLabel = m.type === 'LAW' ? 'Материал' : 'Тест';
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => attach(m.id)}
                      disabled={pendingId !== null}
                      className="w-full text-left px-3 py-2.5 hover:bg-muted/40 transition-colors flex items-center justify-between gap-3 disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{m.title}</div>
                          <div className="text-xs text-muted-foreground">
                            В {m.programCount}{' '}
                            {m.programCount === 1
                              ? 'программе'
                              : m.programCount < 5
                                ? 'программах'
                                : 'программах'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={m.type === 'LAW' ? 'secondary' : 'outline'} className="font-normal">
                          {typeLabel}
                        </Badge>
                        {pendingId === m.id && (
                          <span className="text-xs text-muted-foreground">Привязка…</span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        <DialogFooter className="mt-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Закрыть
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
