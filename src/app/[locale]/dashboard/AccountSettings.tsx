'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { CheckCircle2, AlertCircle, User as UserIcon, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { updateProfile, changePassword, type ActionState } from './actions';

export function AccountSettings({
  initialName,
  initialEmail,
}: {
  initialName: string;
  initialEmail: string;
}) {
  const [profileState, profileAction] = useActionState<ActionState, FormData>(updateProfile, null);
  const [passwordState, passwordAction] = useActionState<ActionState, FormData>(changePassword, null);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            Профиль
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={profileAction} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Имя</Label>
              <Input id="name" name="name" defaultValue={initialName} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={initialEmail} required />
            </div>
            <StatusBanner state={profileState} />
            <SubmitButton>Сохранить</SubmitButton>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-muted-foreground" />
            Пароль
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={passwordAction} className="space-y-3" key={passwordState?.ok ? 'reset' : 'form'}>
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Текущий пароль</Label>
              <Input id="currentPassword" name="currentPassword" type="password" required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">Новый</Label>
                <Input id="newPassword" name="newPassword" type="password" required minLength={6} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Повторите</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={6} />
              </div>
            </div>
            <StatusBanner state={passwordState} />
            <SubmitButton>Сменить пароль</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBanner({ state }: { state: ActionState }) {
  if (!state) return null;
  const Icon = state.ok ? CheckCircle2 : AlertCircle;
  return (
    <div
      className={`flex items-start gap-2 text-xs rounded-md px-3 py-2 ${
        state.ok
          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
          : 'bg-destructive/10 text-destructive'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
      <span>{state.message}</span>
    </div>
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Сохраняем…' : children}
    </Button>
  );
}
