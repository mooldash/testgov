'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { extendAccessByTariff } from '@/app/admin/actions';
import { cn } from '@/lib/utils';

export type ExtendTariff = {
  id: string;
  nameRu: string;
  durationDays: number;
  priceTenge: number;
};

export function ExtendAccessButton({
  accessId,
  tariffs,
}: {
  accessId: string;
  tariffs: ExtendTariff[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    if (!selected) return;
    start(async () => {
      await extendAccessByTariff(accessId, selected);
      setOpen(false);
      setSelected(null);
      router.refresh();
    });
  }

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)} title="Продлить доступ">
        <Clock className="h-3.5 w-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Продлить доступ</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            {tariffs.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                У программы нет тарифов.
              </div>
            ) : (
              tariffs.map((t) => {
                const active = selected === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelected(t.id)}
                    className={cn(
                      'text-left rounded-md border px-3 py-2 transition-colors flex items-center gap-2',
                      active ? 'border-primary bg-primary/5' : 'hover:bg-muted/40 border-input'
                    )}
                  >
                    <div
                      className={cn(
                        'h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center',
                        active ? 'border-primary' : 'border-input'
                      )}
                    >
                      {active && <Check className="h-3 w-3 text-primary" strokeWidth={3} />}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{t.nameRu}</div>
                      <div className="text-xs text-muted-foreground">
                        +{t.durationDays} дн. · {t.priceTenge.toLocaleString('ru-RU')} ₸
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Отмена
              </Button>
            </DialogClose>
            <Button onClick={submit} disabled={pending || !selected}>
              {pending ? 'Продлеваем…' : 'Продлить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
