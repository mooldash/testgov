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
import { upsertProgram } from '../actions';

type Program = {
  id: string;
  categoryId: string;
  slug: string;
  nameRu: string;
  nameKk: string;
  descriptionRu: string | null;
  descriptionKk: string | null;
  isDemo?: boolean;
  isHighlighted?: boolean;
};

function autoSlug() {
  // 8-char random suffix; admin can edit before saving
  const rand = Math.random().toString(36).slice(2, 10);
  return `program-${rand}`;
}

type Cat = { id: string; nameRu: string };

export function ProgramDialog({
  program,
  categories,
  defaultCategoryId,
  trigger,
}: {
  program?: Program;
  categories: Cat[];
  defaultCategoryId?: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(program);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <div onClick={() => setOpen(true)} className="inline-flex">{trigger}</div>
      ) : (
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Добавить
        </Button>
      )}
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Редактировать программу' : 'Новая программа'}</DialogTitle>
        </DialogHeader>
        <form
          action={async (fd) => {
            await upsertProgram(fd);
            setOpen(false);
          }}
          className="grid grid-cols-2 gap-4"
        >
          {program && <input type="hidden" name="id" value={program.id} />}
          <Select
            label="Категория"
            name="categoryId"
            defaultValue={program?.categoryId ?? defaultCategoryId ?? ''}
            options={categories.map((c) => ({ value: c.id, label: c.nameRu }))}
            required
          />
          <Field
            label="Slug"
            name="slug"
            defaultValue={program?.slug ?? autoSlug()}
            required
          />
          <Field label="Название (RU)" name="nameRu" defaultValue={program?.nameRu} required />
          <Field label="Аты (KK)" name="nameKk" defaultValue={program?.nameKk} required />
          <Area label="Описание (RU)" name="descriptionRu" defaultValue={program?.descriptionRu ?? ''} />
          <Area label="Сипаттама (KK)" name="descriptionKk" defaultValue={program?.descriptionKk ?? ''} />

          <div className="col-span-2 grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-4">
            <CheckboxRow
              name="isDemo"
              defaultChecked={program?.isDemo ?? false}
              title="Доступно для демо"
              description="Программу можно проходить без регистрации. Появится в самом низу списка."
            />
            <CheckboxRow
              name="isHighlighted"
              defaultChecked={program?.isHighlighted ?? false}
              title="Выделить на фоне остальных"
              description="Карточка получит акцентную рамку и метку «Рекомендуем»."
            />
          </div>

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

export function ProgramEditButton({
  program,
  categories,
}: {
  program: Program;
  categories: Cat[];
}) {
  return (
    <ProgramDialog
      program={program}
      categories={categories}
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

function Area({
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

function CheckboxRow({
  name,
  defaultChecked,
  title,
  description,
}: {
  name: string;
  defaultChecked: boolean;
  title: string;
  description: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer rounded-md hover:bg-background/50 p-2 -m-2 transition-colors">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 mt-0.5 shrink-0"
      />
      <div className="space-y-1">
        <div className="text-sm font-medium leading-tight">{title}</div>
        <div className="text-xs text-muted-foreground leading-snug">{description}</div>
      </div>
    </label>
  );
}

function Select({
  label,
  name,
  defaultValue,
  options,
  required,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        <option value="">— выберите —</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

