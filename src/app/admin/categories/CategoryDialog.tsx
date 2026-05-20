'use client';

import { useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { upsertCategory } from '../actions';

type Category = {
  id: string;
  slug: string;
  nameRu: string;
  nameKk: string;
  descriptionRu: string | null;
  descriptionKk: string | null;
  order: number;
};

export function CategoryDialog({ category, trigger }: { category?: Category; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(category);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <div onClick={() => setOpen(true)} className="inline-flex">{trigger}</div>
      ) : (
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Добавить
        </Button>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Редактировать категорию' : 'Новая категория'}</DialogTitle>
        </DialogHeader>
        <form
          action={async (fd) => {
            await upsertCategory(fd);
            setOpen(false);
          }}
          className="grid grid-cols-2 gap-3"
        >
          {category && <input type="hidden" name="id" value={category.id} />}
          <Field label="Slug" name="slug" defaultValue={category?.slug} required />
          <Field label="Порядок" name="order" type="number" defaultValue={category?.order ?? 0} />
          <Field label="Название (RU)" name="nameRu" defaultValue={category?.nameRu} required />
          <Field label="Аты (KK)" name="nameKk" defaultValue={category?.nameKk} required />
          <FieldArea label="Описание (RU)" name="descriptionRu" defaultValue={category?.descriptionRu ?? ''} />
          <FieldArea label="Сипаттама (KK)" name="descriptionKk" defaultValue={category?.descriptionKk ?? ''} />
          <DialogFooter className="col-span-2 mt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Отмена</Button>
            </DialogClose>
            <Button type="submit">{isEdit ? 'Сохранить' : 'Создать'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CategoryEditButton({ category }: { category: Category }) {
  return (
    <CategoryDialog
      category={category}
      trigger={
        <Button size="sm" variant="ghost">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      }
    />
  );
}

function Field({
  label,
  name,
  defaultValue,
  type,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue ?? ''} required={required} />
    </div>
  );
}

function FieldArea({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-1.5 col-span-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} defaultValue={defaultValue} rows={2} />
    </div>
  );
}
