'use client';

import { useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { upsertModule } from '../actions';

type Module = {
  id: string;
  type: 'LAW' | 'TEST_COLLECTION';
  isPublished: boolean;
};

export function ModuleDialog({
  module,
  attachToProgramId,
  trigger,
}: {
  module?: Module;
  /**
   * When creating a new module from inside a program drill-down,
   * pass the programId — the new module will be auto-attached.
   */
  attachToProgramId?: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(module);

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
          <DialogTitle>{isEdit ? 'Редактировать модуль' : 'Новый модуль'}</DialogTitle>
        </DialogHeader>
        <form
          action={async (fd) => {
            await upsertModule(fd);
            setOpen(false);
          }}
          className="space-y-3"
        >
          {module && <input type="hidden" name="id" value={module.id} />}
          {!isEdit && attachToProgramId && (
            <input type="hidden" name="attachToProgramId" value={attachToProgramId} />
          )}
          <Select
            label="Тип модуля"
            name="type"
            defaultValue={module?.type ?? 'TEST_COLLECTION'}
            options={[
              { value: 'TEST_COLLECTION', label: 'Сборник тестов' },
              { value: 'LAW', label: 'Учебный материал' },
            ]}
            required
          />
          <Check label="Опубликовано" name="isPublished" defaultChecked={module?.isPublished ?? true} />
          <DialogFooter className="mt-4">
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

export function ModuleEditButton({ module }: { module: Module }) {
  return (
    <ModuleDialog
      module={module}
      trigger={
        <Button size="sm" variant="ghost">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      }
    />
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
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Check({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 rounded border-input" />
      <span className="text-sm">{label}</span>
    </label>
  );
}
