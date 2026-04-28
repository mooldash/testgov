import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { upsertProgram, deleteProgram } from '../actions';

export default async function AdminProgramsPage() {
  const [programs, categories] = await Promise.all([
    prisma.program.findMany({ orderBy: [{ categoryId: 'asc' }, { order: 'asc' }], include: { category: true, _count: { select: { modules: true } } } }),
    prisma.category.findMany({ orderBy: { order: 'asc' } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Программы</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Новая программа</CardTitle></CardHeader>
        <CardContent>
          <form action={upsertProgram} className="grid grid-cols-2 gap-3">
            <SelectField label="Категория" name="categoryId" required options={categories.map(c => ({ value: c.id, label: c.nameRu }))} />
            <TextField label="Slug" name="slug" required />
            <TextField label="Название (RU)" name="nameRu" required />
            <TextField label="Аты (KK)" name="nameKk" required />
            <TextField label="Цена (тенге)" name="priceTenge" type="number" defaultValue="0" />
            <TextField label="Длительность (дней)" name="durationDays" type="number" defaultValue="30" />
            <TextField label="Порядок" name="order" type="number" defaultValue="0" />
            <CheckboxField label="Опубликовано" name="isPublished" defaultChecked />
            <TextAreaField label="Описание (RU)" name="descriptionRu" />
            <TextAreaField label="Сипаттама (KK)" name="descriptionKk" />
            <div className="col-span-2"><Button type="submit">Создать</Button></div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {programs.map((p) => (
          <Card key={p.id}>
            <CardContent className="pt-6">
              <details>
                <summary className="cursor-pointer flex items-center justify-between">
                  <div>
                    <div className="font-medium">{p.nameRu} <span className="text-muted-foreground">/ {p.nameKk}</span></div>
                    <div className="text-xs text-muted-foreground">{p.category.nameRu} · {p.slug} · {p.priceTenge}₸ · модулей: {p._count.modules}</div>
                  </div>
                  <Link href="/admin/modules" className="text-xs text-primary hover:underline">Модули →</Link>
                </summary>
                <form action={upsertProgram} className="grid grid-cols-2 gap-3 mt-4 border-t pt-4">
                  <input type="hidden" name="id" value={p.id} />
                  <SelectField label="Категория" name="categoryId" required options={categories.map(c => ({ value: c.id, label: c.nameRu }))} defaultValue={p.categoryId} />
                  <TextField label="Slug" name="slug" defaultValue={p.slug} required />
                  <TextField label="Название (RU)" name="nameRu" defaultValue={p.nameRu} required />
                  <TextField label="Аты (KK)" name="nameKk" defaultValue={p.nameKk} required />
                  <TextField label="Цена (тенге)" name="priceTenge" type="number" defaultValue={String(p.priceTenge)} />
                  <TextField label="Длительность (дней)" name="durationDays" type="number" defaultValue={String(p.durationDays)} />
                  <TextField label="Порядок" name="order" type="number" defaultValue={String(p.order)} />
                  <CheckboxField label="Опубликовано" name="isPublished" defaultChecked={p.isPublished} />
                  <TextAreaField label="Описание (RU)" name="descriptionRu" defaultValue={p.descriptionRu ?? ''} />
                  <TextAreaField label="Сипаттама (KK)" name="descriptionKk" defaultValue={p.descriptionKk ?? ''} />
                  <div className="col-span-2 flex gap-2">
                    <Button type="submit" size="sm">Сохранить</Button>
                    <DeleteButton id={p.id} />
                  </div>
                </form>
              </details>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TextField(props: { label: string; name: string; type?: string; required?: boolean; defaultValue?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={props.name}>{props.label}</Label>
      <Input id={props.name} {...props} />
    </div>
  );
}
function TextAreaField(props: { label: string; name: string; defaultValue?: string }) {
  return (
    <div className="space-y-1.5 col-span-2">
      <Label htmlFor={props.name}>{props.label}</Label>
      <Textarea id={props.name} name={props.name} defaultValue={props.defaultValue} rows={2} />
    </div>
  );
}
function SelectField(props: { label: string; name: string; required?: boolean; defaultValue?: string; options: { value: string; label: string }[] }) {
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
function CheckboxField(props: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 self-end pb-2">
      <input type="checkbox" name={props.name} defaultChecked={props.defaultChecked} className="h-4 w-4 rounded border-input" />
      <span className="text-sm">{props.label}</span>
    </label>
  );
}
function DeleteButton({ id }: { id: string }) {
  async function onDelete() { 'use server'; await deleteProgram(id); }
  return (
    <form action={onDelete}>
      <Button type="submit" size="sm" variant="destructive">Удалить</Button>
    </form>
  );
}
