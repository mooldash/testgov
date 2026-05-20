'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, User as UserIcon, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { grantAccessManual } from '@/app/admin/actions';
import { cn } from '@/lib/utils';

export type UserOption = { id: string; email: string; name: string | null };
export type ProgramOption = { id: string; nameRu: string };
export type TariffOption = {
  id: string;
  programId: string;
  nameRu: string;
  durationDays: number;
  priceTenge: number;
  recommended: boolean;
};

export function GrantAccessDialog({
  users,
  programs,
  tariffs,
}: {
  users: UserOption[];
  programs: ProgramOption[];
  tariffs: TariffOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [selectedTariffId, setSelectedTariffId] = useState<string>('');
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users.slice(0, 8);
    return users
      .filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          (u.name && u.name.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [users, userQuery]);

  const programTariffs = useMemo(
    () => tariffs.filter((t) => t.programId === selectedProgramId),
    [tariffs, selectedProgramId]
  );

  const selectedUser = users.find((u) => u.id === selectedUserId);

  function reset() {
    setUserQuery('');
    setSelectedUserId(null);
    setSelectedProgramId('');
    setSelectedTariffId('');
    setError(null);
  }

  function submit() {
    if (!selectedUserId || !selectedProgramId || !selectedTariffId) {
      setError('Заполните все поля');
      return;
    }
    setError(null);
    start(async () => {
      try {
        await grantAccessManual({
          userId: selectedUserId,
          programId: selectedProgramId,
          tariffId: selectedTariffId,
        });
        setOpen(false);
        reset();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ошибка');
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1.5" />
        Выдать доступ
      </Button>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Выдать доступ вручную</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* User picker */}
          <div className="space-y-2">
            <Label>Пользователь</Label>
            {selectedUser ? (
              <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <UserIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{selectedUser.email}</div>
                    {selectedUser.name && (
                      <div className="text-xs text-muted-foreground truncate">{selectedUser.name}</div>
                    )}
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setSelectedUserId(null)}>
                  Сменить
                </Button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Введите email или имя"
                    className="pl-8"
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    autoFocus
                  />
                </div>
                {filteredUsers.length > 0 && (
                  <div className="border rounded-md max-h-52 overflow-y-auto bg-card">
                    {filteredUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setSelectedUserId(u.id)}
                        className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="text-sm truncate">{u.email}</div>
                          {u.name && (
                            <div className="text-xs text-muted-foreground truncate">{u.name}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {filteredUsers.length === 0 && userQuery.trim() && (
                  <div className="text-xs text-muted-foreground px-1">Пользователь не найден</div>
                )}
              </>
            )}
          </div>

          {/* Program */}
          <div className="space-y-1.5">
            <Label htmlFor="programId">Программа</Label>
            <select
              id="programId"
              value={selectedProgramId}
              onChange={(e) => {
                setSelectedProgramId(e.target.value);
                setSelectedTariffId('');
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">— выберите —</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nameRu}
                </option>
              ))}
            </select>
          </div>

          {/* Tariff (depends on program) */}
          <div className="space-y-2">
            <Label>Тариф</Label>
            {!selectedProgramId ? (
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                Сначала выберите программу
              </div>
            ) : programTariffs.length === 0 ? (
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                У этой программы пока нет тарифов
              </div>
            ) : (
              <div className="grid gap-2">
                {programTariffs.map((t) => {
                  const active = selectedTariffId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTariffId(t.id)}
                      className={cn(
                        'text-left rounded-md border px-3 py-2 transition-colors flex items-center justify-between gap-3',
                        active
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/40 border-input'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={cn(
                            'h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center',
                            active ? 'border-primary' : 'border-input'
                          )}
                        >
                          {active && <Check className="h-3 w-3 text-primary" strokeWidth={3} />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium">
                            {t.nameRu}
                            {t.recommended && (
                              <span className="ml-1.5 text-xs text-primary">★</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t.durationDays} дн. · {t.priceTenge.toLocaleString('ru-RU')} ₸
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={pending}>
              Отмена
            </Button>
          </DialogClose>
          <Button
            onClick={submit}
            disabled={pending || !selectedUserId || !selectedProgramId || !selectedTariffId}
          >
            {pending ? 'Выдаём…' : 'Выдать доступ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
