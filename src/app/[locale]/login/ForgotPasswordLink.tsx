'use client';

import { useState } from 'react';
import { KeyRound, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

export function ForgotPasswordLink({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false);
  const isKk = locale === 'kk';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-muted-foreground hover:text-primary underline-offset-2 hover:underline transition-colors"
      >
        {isKk ? 'Құпиясөзді ұмыттыңыз ба?' : 'Забыли пароль?'}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <KeyRound className="h-4 w-4" />
              </span>
              {isKk ? 'Құпиясөзді қалпына келтіру' : 'Восстановление пароля'}
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              {isKk
                ? 'Сіздің тіркелгіңізге қол жеткізуді қалпына келтіру үшін бізге email арқылы жазыңыз — біз қолмен жаңа құпиясөз жасап береміз.'
                : 'Чтобы восстановить доступ к вашему аккаунту, напишите нам на email — мы вручную сгенерируем новый пароль и пришлём вам.'}
            </p>
            <div className="rounded-md border bg-muted/30 p-3 flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <a
                href="mailto:support@testgov.kz"
                className="text-sm font-medium text-primary hover:underline"
              >
                support@testgov.kz
              </a>
            </div>
            <p className="text-xs">
              {isKk
                ? 'Email-да жауап орташа 1 жұмыс күні ішінде келеді. Хатта тіркелгіңіздің email-ын көрсетіңіз.'
                : 'Ответ обычно приходит в течение 1 рабочего дня. В письме укажите email вашего аккаунта.'}
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {isKk ? 'Жабу' : 'Закрыть'}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
