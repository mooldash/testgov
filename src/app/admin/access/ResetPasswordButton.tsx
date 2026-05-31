'use client';

import { useState } from 'react';
import { KeyRound, Loader2, Copy, Check, MessageCircle, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { resetUserPassword } from '../actions';

type Result = {
  newPassword: string;
  email: string;
  phone: string | null;
  name: string | null;
};

export function ResetPasswordButton({
  userId,
  variant = 'icon',
}: {
  userId: string;
  variant?: 'icon' | 'inline';
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function doReset(mode: 'default' | 'random') {
    setPending(true);
    setError(null);
    try {
      const r = await resetUserPassword(userId, mode);
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сброса');
    } finally {
      setPending(false);
    }
  }

  function copyPassword() {
    if (!result) return;
    navigator.clipboard.writeText(result.newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function whatsappHref(): string | null {
    if (!result?.phone) return null;
    const digits = result.phone.replace(/\D/g, '');
    if (!digits) return null;
    const greeting = result.name ? `Здравствуйте, ${result.name}!` : 'Здравствуйте!';
    const text = `${greeting} Ваш новый пароль на testgov.kz: ${result.newPassword}\n\nЛогин (email): ${result.email}\n\nПосле входа можно поменять пароль в разделе «Кабинет → Настройки».`;
    return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      // reset state when closing
      setTimeout(() => {
        setResult(null);
        setError(null);
        setCopied(false);
      }, 200);
    }
  }

  const Trigger = variant === 'inline' ? (
    <Button size="sm" variant="ghost" onClick={() => setOpen(true)} title="Сбросить пароль">
      <KeyRound className="h-3.5 w-3.5 mr-1.5" /> Сбросить пароль
    </Button>
  ) : (
    <Button size="sm" variant="ghost" onClick={() => setOpen(true)} title="Сбросить пароль">
      <KeyRound className="h-3.5 w-3.5" />
    </Button>
  );

  const wa = whatsappHref();

  return (
    <>
      {Trigger}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Сбросить пароль</DialogTitle>
          </DialogHeader>

          {!result ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Выбери, каким будет новый пароль. После сброса старый пароль больше работать не будет.
              </p>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => doReset('default')}
                  className="w-full text-left rounded-md border bg-background hover:bg-accent hover:text-accent-foreground transition-colors px-3 py-3 flex items-start gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm leading-tight">Использовать дефолтный</div>
                    <div className="text-xs text-muted-foreground mt-1 leading-snug whitespace-normal">
                      Из «Настройки → Сброс паролей». Если не задан — будет случайный.
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => doReset('random')}
                  className="w-full text-left rounded-md border bg-background hover:bg-accent hover:text-accent-foreground transition-colors px-3 py-3 flex items-start gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm leading-tight">Сгенерировать случайный</div>
                    <div className="text-xs text-muted-foreground mt-1 leading-snug whitespace-normal">
                      10 символов вида <span className="font-mono">Aq7-Mk3-Lp2</span>.
                    </div>
                  </div>
                </button>
              </div>
              {pending && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Сбрасываю…
                </div>
              )}
              {error && (
                <div className="rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2">{error}</div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="text-xs text-muted-foreground mb-1">Новый пароль</div>
                <div className="flex items-center justify-between gap-3">
                  <div className="font-mono text-xl font-semibold tracking-wider">
                    {result.newPassword}
                  </div>
                  <Button size="sm" variant="ghost" onClick={copyPassword} title="Скопировать">
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-1 text-emerald-600" /> Скопировано
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" /> Копировать
                      </>
                    )}
                  </Button>
                </div>
                <div className="mt-3 text-xs text-muted-foreground space-y-0.5">
                  <div><span className="font-medium">Логин:</span> {result.email}</div>
                  {result.phone && <div><span className="font-medium">Телефон:</span> {result.phone}</div>}
                </div>
              </div>

              <div className="rounded-md border border-amber-500/30 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200 text-xs px-3 py-2">
                Пароль показывается <strong>один раз</strong>. После закрытия окна его больше нельзя будет посмотреть — только сбросить заново.
              </div>

              {wa ? (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="block">
                  <Button type="button" className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <MessageCircle className="h-4 w-4 mr-2" /> Отправить в WhatsApp
                  </Button>
                </a>
              ) : (
                <p className="text-xs text-muted-foreground text-center">
                  У пользователя не указан телефон — отправь пароль другим способом.
                </p>
              )}
            </div>
          )}

          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {result ? 'Готово' : 'Отмена'}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
