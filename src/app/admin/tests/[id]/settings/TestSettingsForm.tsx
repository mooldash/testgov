import type { Test } from '@prisma/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { upsertTest } from '@/app/admin/actions';

export function TestSettingsForm({
  test,
  moduleId,
  defaultLocale,
}: {
  test?: Test;
  moduleId: string;
  defaultLocale?: 'RU' | 'KK';
}) {
  return (
    <form action={upsertTest} className="grid grid-cols-2 gap-4">
      {test && <input type="hidden" name="id" value={test.id} />}
      <input type="hidden" name="moduleId" value={moduleId} />

      <Field label="Название" name="title" defaultValue={test?.title} required className="col-span-2" />

      <SelectField label="Язык" name="locale" defaultValue={test?.locale ?? defaultLocale ?? 'RU'} options={[
        { value: 'RU', label: 'Русский' }, { value: 'KK', label: 'Қазақша' },
      ]} />

      <SelectField label="Режим" name="mode" defaultValue={test?.mode ?? 'INSTANT_FEEDBACK'} options={[
        { value: 'CLASSIC', label: 'Классический' },
        { value: 'CLASSIC_WITH_BACK', label: 'Классический с возвратом' },
        { value: 'INSTANT_FEEDBACK', label: 'Мгновенная обратная связь' },
        { value: 'ALL_QUESTIONS_PAGE', label: 'Все вопросы на одной странице' },
      ]} />

      <Field label="Время (сек, пусто = без лимита)" name="timeLimitSec" type="number" defaultValue={test?.timeLimitSec ?? ''} />
      <Field label="Макс. попыток (пусто = ∞)" name="maxAttempts" type="number" defaultValue={test?.maxAttempts ?? ''} />
      <Field label="Проходной балл (%)" name="passingScore" type="number" defaultValue={test?.passingScore ?? 70} required />
      <Field label="Лимит вопросов (пусто = все)" name="questionLimit" type="number" defaultValue={test?.questionLimit ?? ''} />

      <Check label="Перемешивать вопросы" name="shuffleQuestions" defaultChecked={test?.shuffleQuestions} />
      <Check label="Перемешивать ответы" name="shuffleAnswers" defaultChecked={test?.shuffleAnswers} />
      <Check label="Требовать вход" name="requireAuth" defaultChecked={test?.requireAuth ?? true} />
      <Check label="Обязательный ответ" name="requireAnswer" defaultChecked={test?.requireAnswer} />
      <Check label="Показывать счёт во время теста" name="showScoreDuring" defaultChecked={test?.showScoreDuring ?? true} />
      <Check label="Показывать правильные ответы" name="showCorrectAnswers" defaultChecked={test?.showCorrectAnswers ?? true} />
      <Check label="Email уведомления" name="emailNotifications" defaultChecked={test?.emailNotifications} />
      <Check label="Опубликовано" name="isPublished" defaultChecked={test?.isPublished ?? true} />

      <div className="col-span-2"><Button type="submit">Сохранить</Button></div>
    </form>
  );
}

function Field({ label, name, defaultValue, type, required, className }: {
  label: string; name: string; defaultValue?: string | number | null; type?: string; required?: boolean; className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue ?? ''} required={required} />
    </div>
  );
}
function SelectField({ label, name, defaultValue, options }: {
  label: string; name: string; defaultValue: string; options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <select id={name} name={name} defaultValue={defaultValue} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
function Check({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 self-end pb-2">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 rounded border-input" />
      <span className="text-sm">{label}</span>
    </label>
  );
}
