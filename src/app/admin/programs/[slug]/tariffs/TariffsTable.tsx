'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import {
  ChevronDown,
  Sparkles,
  CheckCircle2,
  Loader2,
  Trash2,
  Plus,
} from 'lucide-react';
import type { Tariff } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { saveTariff, deleteTariff } from '@/app/admin/actions';
import { cn } from '@/lib/utils';

type Editable = {
  id: string;
  programId: string;
  key: string;
  nameRu: string;
  nameKk: string;
  durationDays: number;
  priceTenge: number;
  featuresRu: string[];
  featuresKk: string[];
  recommended: boolean;
  order: number;
  isPublished: boolean;
};

function toEditable(t: Tariff): Editable {
  return {
    id: t.id,
    programId: t.programId,
    key: t.key,
    nameRu: t.nameRu,
    nameKk: t.nameKk,
    durationDays: t.durationDays,
    priceTenge: t.priceTenge,
    featuresRu: [...t.featuresRu],
    featuresKk: [...t.featuresKk],
    recommended: t.recommended,
    order: t.order,
    isPublished: t.isPublished,
  };
}

function fmtTenge(n: number) {
  return new Intl.NumberFormat('ru-RU').format(n) + ' ₸';
}

export function TariffsTable({
  programId,
  initial,
}: {
  programId: string;
  initial: Tariff[];
}) {
  const [rows, setRows] = useState<Editable[]>(initial.map(toEditable));
  const [openId, setOpenId] = useState<string | null>(null);

  function handleSavedRemote(id: string, patch: Partial<Editable>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function handleDeleted(id: string) {
    setRows((rs) => rs.filter((r) => r.id !== id));
    if (openId === id) setOpenId(null);
  }
  async function addNew() {
    const maxOrder = rows.reduce((m, r) => Math.max(m, r.order), 0);
    // Pick a unique key
    const used = new Set(rows.map((r) => r.key));
    let key = 'custom';
    let i = 1;
    while (used.has(key)) {
      key = `custom${i++}`;
    }
    const res = await saveTariff({
      programId,
      key,
      nameRu: 'Новый тариф',
      nameKk: 'Жаңа тариф',
      durationDays: 7,
      priceTenge: 0,
      featuresRu: [],
      featuresKk: [],
      recommended: false,
      order: maxOrder + 1,
      isPublished: true,
    });
    setRows((rs) => [
      ...rs,
      {
        id: res.id,
        programId,
        key,
        nameRu: 'Новый тариф',
        nameKk: 'Жаңа тариф',
        durationDays: 7,
        priceTenge: 0,
        featuresRu: [],
        featuresKk: [],
        recommended: false,
        order: maxOrder + 1,
        isPublished: true,
      },
    ]);
    setOpenId(res.id);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={addNew}>
          <Plus className="h-4 w-4 mr-1.5" />
          Добавить тариф
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Тариф</TableHead>
            <TableHead className="w-32 text-right">Цена</TableHead>
            <TableHead className="w-24 text-right">Дней</TableHead>
            <TableHead className="w-12 text-center">★</TableHead>
            <TableHead className="w-12 text-center">✓</TableHead>
            <TableHead className="w-40 text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                Тарифов нет. Нажмите «Добавить тариф».
              </TableCell>
            </TableRow>
          )}
          {rows.map((row, idx) => (
            <TariffRow
              key={row.id}
              n={idx + 1}
              row={row}
              isOpen={openId === row.id}
              onToggle={() => setOpenId((id) => (id === row.id ? null : row.id))}
              onSavedRemote={(patch) => handleSavedRemote(row.id, patch)}
              onDeleted={() => handleDeleted(row.id)}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TariffRow({
  n,
  row,
  isOpen,
  onToggle,
  onSavedRemote,
  onDeleted,
}: {
  n: number;
  row: Editable;
  isOpen: boolean;
  onToggle: () => void;
  onSavedRemote: (patch: Partial<Editable>) => void;
  onDeleted: () => void;
}) {
  const [draft, setDraft] = useState(row);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [deletePending, startDelete] = useTransition();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const skipNextSave = useRef(true);

  // Sync external updates
  useEffect(() => {
    setDraft(row);
    skipNextSave.current = true;
  }, [row.id, row.order]);

  // Debounced auto-save
  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        await saveTariff({
          id: draft.id,
          programId: draft.programId,
          key: draft.key,
          nameRu: draft.nameRu,
          nameKk: draft.nameKk,
          durationDays: draft.durationDays,
          priceTenge: draft.priceTenge,
          featuresRu: draft.featuresRu,
          featuresKk: draft.featuresKk,
          recommended: draft.recommended,
          order: draft.order,
          isPublished: draft.isPublished,
        });
        onSavedRemote(draft);
        setSavedAt(Date.now());
      } finally {
        setSaving(false);
      }
    }, 600);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  function patch<K extends keyof Editable>(k: K, v: Editable[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  function handleDelete() {
    if (!confirm(`Удалить тариф «${draft.nameRu}»?`)) return;
    startDelete(async () => {
      await deleteTariff(draft.id);
      onDeleted();
    });
  }

  const justSaved = savedAt && Date.now() - savedAt < 2500;

  return (
    <>
      <TableRow className={cn(isOpen && 'bg-muted/30')}>
        <TableCell className="text-muted-foreground tabular-nums">{n}</TableCell>
        <TableCell>
          <div className="font-medium leading-tight flex items-center gap-2">
            {draft.nameRu}
            {draft.recommended && (
              <Badge variant="default" className="gap-1 font-normal">
                <Sparkles className="h-3 w-3" />
                Рекомендуем
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground font-mono">{draft.key}</div>
        </TableCell>
        <TableCell className="text-right tabular-nums">{fmtTenge(draft.priceTenge)}</TableCell>
        <TableCell className="text-right tabular-nums">{draft.durationDays}</TableCell>
        <TableCell className="text-center">{draft.recommended ? '★' : ''}</TableCell>
        <TableCell className="text-center">
          {draft.isPublished ? (
            <span className="text-emerald-600">●</span>
          ) : (
            <span className="text-muted-foreground">○</span>
          )}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end items-center gap-2">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            {!saving && justSaved && (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> сохранено
              </span>
            )}
            <Button size="sm" variant={isOpen ? 'secondary' : 'outline'} onClick={onToggle}>
              {isOpen ? 'Закрыть' : 'Редактировать'}
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 ml-1 transition-transform',
                  isOpen && 'rotate-180'
                )}
              />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {isOpen && (
        <TableRow className="bg-muted/20 hover:bg-muted/20">
          <TableCell colSpan={7} className="p-6">
            <div className="grid md:grid-cols-2 gap-4 max-w-5xl">
              <div className="space-y-1.5">
                <Label>Ключ (latin, цифры, дефис)</Label>
                <Input
                  value={draft.key}
                  onChange={(e) => patch('key', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Цена (₸)</Label>
                  <Input
                    type="number"
                    value={draft.priceTenge}
                    onChange={(e) => patch('priceTenge', Number(e.target.value || 0))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Срок (дней)</Label>
                  <Input
                    type="number"
                    value={draft.durationDays}
                    onChange={(e) => patch('durationDays', Math.max(1, Number(e.target.value || 1)))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Название (RU)</Label>
                <Input
                  value={draft.nameRu}
                  onChange={(e) => patch('nameRu', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Атауы (KK)</Label>
                <Input
                  value={draft.nameKk}
                  onChange={(e) => patch('nameKk', e.target.value)}
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Что входит — RU (каждая строка = пункт)</Label>
                <Textarea
                  rows={5}
                  value={draft.featuresRu.join('\n')}
                  onChange={(e) =>
                    patch(
                      'featuresRu',
                      e.target.value.split('\n').map((s) => s.trimEnd()).filter((s) => s.length > 0)
                    )
                  }
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Не кіреді — KK (әр жол = тармақ)</Label>
                <Textarea
                  rows={5}
                  value={draft.featuresKk.join('\n')}
                  onChange={(e) =>
                    patch(
                      'featuresKk',
                      e.target.value.split('\n').map((s) => s.trimEnd()).filter((s) => s.length > 0)
                    )
                  }
                />
              </div>
              <div className="flex items-center gap-4 md:col-span-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.recommended}
                    onChange={(e) => patch('recommended', e.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                  Рекомендуем (выделяется на клиенте)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.isPublished}
                    onChange={(e) => patch('isPublished', e.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                  Опубликовано
                </label>
              </div>
              <div className="md:col-span-2 flex justify-end pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleDelete}
                  disabled={deletePending}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Удалить тариф
                </Button>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
