import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { upsertModule, deleteModule } from '../actions';

export default async function AdminModulesPage() {
  const [modules, programs] = await Promise.all([
    prisma.module.findMany({
      orderBy: [{ programId: 'asc' }, { order: 'asc' }],
      include: { program: true, _count: { select: { tests: true, contents: true } } },
    }),
    prisma.program.findMany({ orderBy: { order: 'asc' } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Модули</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Новый модуль</CardTitle></CardHeader>
        <CardContent>
          <form action={upsertModule} className="grid grid-cols-2 gap-3">
            <Select label="Программа" name="programId" required options={programs.map(p => ({ value: p.id, label: p.nameRu }))} />
            <Select label="Тип" name="type" required options={[{ value: 'LAW', label: 'Закон / материал' }, { value: 'TEST_COLLECTION', label: 'Сборник тестов' }]} />
            <Text label="Порядок" name="order" type="number" defaultValue="0" />
            <Check label="Опубликовано" name="isPublished" defaultChecked />
            <div className="col-span-2"><Button type="submit">Создать</Button></div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {modules.map((m) => (
          <Card key={m.id}>
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <div className="font-medium">{m.program.nameRu} · #{m.order} · {m.type}</div>
                <div className="text-xs text-muted-foreground">контент (RU/KK): {m._count.contents} · тестов: {m._count.tests}</div>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/modules/${m.id}`}><Button size="sm" variant="outline">Открыть</Button></Link>
                <DeleteForm id={m.id} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Text(props: { label: string; name: string; type?: string; required?: boolean; defaultValue?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={props.name}>{props.label}</Label>
      <Input id={props.name} {...props} />
    </div>
  );
}
function Select(props: { label: string; name: string; required?: boolean; defaultValue?: string; options: { value: string; label: string }[] }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={props.name}>{props.label}</Label>
      <select id={props.name} name={props.name} required={props.required} defaultValue={props.defaultValue} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
        <option value="">— выберите —</option>
        {props.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
function Check(props: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 self-end pb-2">
      <input type="checkbox" name={props.name} defaultChecked={props.defaultChecked} className="h-4 w-4 rounded border-input" />
      <span className="text-sm">{props.label}</span>
    </label>
  );
}
function DeleteForm({ id }: { id: string }) {
  async function go() { 'use server'; await deleteModule(id); }
  return (
    <form action={go}>
      <Button type="submit" size="sm" variant="destructive">Удалить</Button>
    </form>
  );
}
