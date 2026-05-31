'use client';

import { useMemo, useState } from 'react';
import { Plus, Pencil, Search } from 'lucide-react';
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
import { CATEGORY_ICONS, resolveCategoryIconKey } from '@/lib/category-icons';
import { cn } from '@/lib/utils';

type Category = {
  id: string;
  slug: string;
  nameRu: string;
  nameKk: string;
  descriptionRu: string | null;
  descriptionKk: string | null;
  iconKey: string | null;
  order: number;
};

export function CategoryDialog({ category, trigger }: { category?: Category; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const initialIconKey = category ? resolveCategoryIconKey(category.iconKey, category.slug) : '';
  const [iconKey, setIconKey] = useState<string>(initialIconKey);
  const [iconQuery, setIconQuery] = useState('');
  const isEdit = Boolean(category);

  const filteredIcons = useMemo(() => {
    const q = iconQuery.trim().toLowerCase();
    if (!q) return CATEGORY_ICONS;
    return CATEGORY_ICONS.filter(
      (i) => i.label.toLowerCase().includes(q) || i.key.toLowerCase().includes(q)
    );
  }, [iconQuery]);

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
          <input type="hidden" name="iconKey" value={iconKey} />
          <Field label="Slug" name="slug" defaultValue={category?.slug} required />
          <Field label="Порядок" name="order" type="number" defaultValue={category?.order ?? 0} />
          <Field label="Название (RU)" name="nameRu" defaultValue={category?.nameRu} required />
          <Field label="Аты (KK)" name="nameKk" defaultValue={category?.nameKk} required />
          <FieldArea label="Описание (RU)" name="descriptionRu" defaultValue={category?.descriptionRu ?? ''} />
          <FieldArea label="Сипаттама (KK)" name="descriptionKk" defaultValue={category?.descriptionKk ?? ''} />

          <div className="col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <Label>Иконка</Label>
              {iconKey && (
                <button
                  type="button"
                  onClick={() => setIconKey('')}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Сбросить
                </button>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Поиск иконки (по названию)"
                value={iconQuery}
                onChange={(e) => setIconQuery(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <div className="grid grid-cols-10 gap-1.5 max-h-48 overflow-y-auto rounded-md border p-2 bg-muted/20">
              {filteredIcons.length === 0 && (
                <div className="col-span-10 text-center text-xs text-muted-foreground py-4">
                  Ничего не найдено
                </div>
              )}
              {filteredIcons.map((opt) => {
                const Icon = opt.icon;
                const selected = iconKey === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setIconKey(opt.key)}
                    title={opt.label}
                    className={cn(
                      'h-9 w-9 rounded-md inline-flex items-center justify-center transition-colors border',
                      selected
                        ? 'bg-primary text-primary-foreground border-primary ring-2 ring-primary/30'
                        : 'border-transparent bg-background text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
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
