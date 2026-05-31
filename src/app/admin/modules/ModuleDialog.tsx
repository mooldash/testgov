'use client';

import { useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
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
import { upsertModule } from '../actions';

type ModuleType = 'LAW' | 'TEST_COLLECTION' | 'EXAM';

type Module = {
  id: string;
  type: ModuleType;
  isPublished: boolean;
  examQuestionsPerTest?: number | null;
  examTimeLimitSec?: number | null;
  examPassingScore?: number | null;
};

export function ModuleDialog({
  module,
  attachToProgramId,
  trigger,
}: {
  module?: Module;
  attachToProgramId?: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ModuleType>(module?.type ?? 'TEST_COLLECTION');
  const isEdit = Boolean(module);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <div onClick={() => setOpen(true)} className="inline-flex">
          {trigger}
        </div>
      ) : (
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Добавить
        </Button>
      )}
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Редактировать модуль' : 'Новый модуль'}</DialogTitle>
        </DialogHeader>
        <form
          action={async (fd) => {
            await upsertModule(fd);
            setOpen(false);
          }}
          className="space-y-4"
        >
          {module && <input type="hidden" name="id" value={module.id} />}
          {!isEdit && attachToProgramId && (
            <input type="hidden" name="attachToProgramId" value={attachToProgramId} />
          )}
          <div className="space-y-1.5">
            <Label htmlFor="type">Тип модуля</Label>
            <select
              id="type"
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value as ModuleType)}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="TEST_COLLECTION">Сборник тестов</option>
              <option value="LAW">Учебный материал</option>
              <option value="EXAM">Итоговый экзамен</option>
            </select>
            {type === 'EXAM' && (
              <p className="text-xs text-muted-foreground">
                Экзамен берёт случайные вопросы из всех тестов программы и собирает в одну сессию по чаптерам.
              </p>
            )}
          </div>

          {type === 'EXAM' && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                Параметры экзамена
              </div>
              <div className="grid grid-cols-3 gap-3">
                <NumField
                  label="Вопросов с теста"
                  name="examQuestionsPerTest"
                  defaultValue={module?.examQuestionsPerTest ?? 15}
                  min={1}
                  max={500}
                />
                <NumField
                  label="Время (минут)"
                  name="examTimeLimitMin"
                  defaultValue={
                    module?.examTimeLimitSec ? Math.floor(module.examTimeLimitSec / 60) : 90
                  }
                  min={1}
                  max={600}
                />
                <NumField
                  label="Проходной (%)"
                  name="examPassingScore"
                  defaultValue={module?.examPassingScore ?? 60}
                  min={1}
                  max={100}
                />
              </div>
            </div>
          )}

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isPublished"
              defaultChecked={module?.isPublished ?? true}
              className="h-4 w-4 rounded border-input"
            />
            <span className="text-sm">Опубликовано</span>
          </label>

          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Отмена
              </Button>
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

function NumField({
  label,
  name,
  defaultValue,
  min,
  max,
}: {
  label: string;
  name: string;
  defaultValue: number;
  min?: number;
  max?: number;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={name} className="text-xs">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        type="number"
        defaultValue={defaultValue}
        min={min}
        max={max}
        required
      />
    </div>
  );
}
