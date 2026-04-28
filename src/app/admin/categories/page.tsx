import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { upsertCategory, deleteCategory } from '../actions';

export default async function AdminCategoriesPage() {
  const cats = await prisma.category.findMany({ orderBy: { order: 'asc' }, include: { _count: { select: { programs: true } } } });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Категории</h1>
      <Card>
        <CardHeader><CardTitle className="text-base">Новая категория</CardTitle></CardHeader>
        <CardContent>
          <form action={upsertCategory} className="grid grid-cols-2 gap-3">
            <Field label="Slug" name="slug" required />
            <Field label="Порядок" name="order" type="number" defaultValue="0" />
            <Field label="Название (RU)" name="nameRu" required />
            <Field label="Аты (KK)" name="nameKk" required />
            <FieldText label="Описание (RU)" name="descriptionRu" />
            <FieldText label="Сипаттама (KK)" name="descriptionKk" />
            <div className="col-span-2"><Button type="submit">Создать</Button></div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {cats.map((c) => (
          <Card key={c.id}>
            <CardContent className="pt-6">
              <details>
                <summary className="cursor-pointer flex items-center justify-between">
                  <div>
                    <div className="font-medium">{c.nameRu} <span className="text-muted-foreground">/ {c.nameKk}</span></div>
                    <div className="text-xs text-muted-foreground">{c.slug} · программ: {c._count.programs}</div>
                  </div>
                </summary>
                <form action={upsertCategory} className="grid grid-cols-2 gap-3 mt-4 border-t pt-4">
                  <input type="hidden" name="id" value={c.id} />
                  <Field label="Slug" name="slug" defaultValue={c.slug} required />
                  <Field label="Порядок" name="order" type="number" defaultValue={String(c.order)} />
                  <Field label="Название (RU)" name="nameRu" defaultValue={c.nameRu} required />
                  <Field label="Аты (KK)" name="nameKk" defaultValue={c.nameKk} required />
                  <FieldText label="Описание (RU)" name="descriptionRu" defaultValue={c.descriptionRu ?? ''} />
                  <FieldText label="Сипаттама (KK)" name="descriptionKk" defaultValue={c.descriptionKk ?? ''} />
                  <div className="col-span-2 flex gap-2">
                    <Button type="submit" size="sm">Сохранить</Button>
                    <DeleteButton id={c.id} />
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

function Field({ label, name, ...rest }: { label: string; name: string; type?: string; required?: boolean; defaultValue?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...rest} />
    </div>
  );
}

function FieldText({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) {
  return (
    <div className="space-y-1.5 col-span-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} defaultValue={defaultValue} rows={2} />
    </div>
  );
}

function DeleteButton({ id }: { id: string }) {
  async function onDelete() {
    'use server';
    await deleteCategory(id);
  }
  return (
    <form action={onDelete}>
      <Button type="submit" size="sm" variant="destructive">Удалить</Button>
    </form>
  );
}
