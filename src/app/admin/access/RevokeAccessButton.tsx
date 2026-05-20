'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { revokeAccess } from '@/app/admin/actions';

export function RevokeAccessButton({
  accessId,
  userEmail,
  programName,
}: {
  accessId: string;
  userEmail: string;
  programName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function submit() {
    start(async () => {
      await revokeAccess(accessId);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
        title="Отозвать доступ"
        onClick={() => setOpen(true)}
      >
        ✕
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
                <AlertTriangle className="h-4 w-4" />
              </span>
              Отозвать доступ?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Доступ пользователя <span className="font-medium text-foreground">{userEmail}</span> к программе{' '}
            <span className="font-medium text-foreground">«{programName}»</span> будет удалён. История попыток сохранится, но пользователь больше не сможет проходить тесты до повторной выдачи.
          </p>
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Отмена
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={submit}
              disabled={pending}
            >
              {pending ? 'Отзываем…' : 'Отозвать доступ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
