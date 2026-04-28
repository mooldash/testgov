import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { grantAccess, revokeAccess } from '../actions';

export default async function AdminAccessPage() {
  const [accesses, programs] = await Promise.all([
    prisma.userAccess.findMany({
      orderBy: { expiresAt: 'desc' },
      include: { user: true, program: true },
      take: 200,
    }),
    prisma.program.findMany({ orderBy: { order: 'asc' } }),
  ]);

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-semibold">Доступы</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Выдать доступ вручную</CardTitle></CardHeader>
        <CardContent>
          <form action={grantAccess} className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email пользователя</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="programId">Программа</Label>
              <select id="programId" name="programId" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">— выберите —</option>
                {programs.map((p) => <option key={p.id} value={p.id}>{p.nameRu}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="durationDays">Дней</Label>
              <Input id="durationDays" name="durationDays" type="number" defaultValue="30" required />
            </div>
            <div className="col-span-3"><Button type="submit">Выдать</Button></div>
          </form>
        </CardContent>
      </Card>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="p-3 font-medium">Пользователь</th>
              <th className="p-3 font-medium">Программа</th>
              <th className="p-3 font-medium">Истекает</th>
              <th className="p-3 font-medium">Источник</th>
              <th className="p-3 font-medium">Статус</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {accesses.map((a) => {
              const active = a.expiresAt > new Date();
              return (
                <tr key={a.id} className="border-t">
                  <td className="p-3">{a.user.email}</td>
                  <td className="p-3">{a.program.nameRu}</td>
                  <td className="p-3 text-muted-foreground">{formatDateTime(a.expiresAt, 'ru')}</td>
                  <td className="p-3"><Badge variant="outline">{a.source}</Badge></td>
                  <td className="p-3">{active ? <Badge variant="success">Активен</Badge> : <Badge variant="secondary">Истёк</Badge>}</td>
                  <td className="p-3"><RevokeButton id={a.id} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RevokeButton({ id }: { id: string }) {
  async function go() { 'use server'; await revokeAccess(id); }
  return (
    <form action={go}>
      <Button type="submit" size="sm" variant="ghost">Удалить</Button>
    </form>
  );
}
