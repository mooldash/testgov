'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { deleteCategory } from '../actions';

export function DeleteCategoryButton({
  categoryId,
  categoryName,
  programCount,
}: {
  categoryId: string;
  categoryName: string;
  programCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteCategory(categoryId);
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Не удалось удалить');
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
        title="Удалить категорию"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        <X className="h-3.5 w-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить категорию «{categoryName}»?</DialogTitle>
            <DialogDescription>
              {programCount > 0
                ? `В категории ${programCount} ${programCount === 1 ? 'программа' : 'программ(ы)'} с основной привязкой. Сначала перенесите их в другую категорию через редактирование программы — иначе удалить нельзя.`
                : 'Эту категорию можно удалить. Дополнительные привязки других программ к ней (если есть) просто исчезнут — сами программы останутся в своих основных категориях.'}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Отмена
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={pending || programCount > 0}
            >
              {pending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
