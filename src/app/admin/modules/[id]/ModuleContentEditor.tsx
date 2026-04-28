'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { TipTapEditor } from '@/components/editor/TipTapEditor';
import { upsertModuleContent } from '@/app/admin/actions';
import { cn } from '@/lib/utils';

interface SideState { title: string; bodyHtml: string }

export function ModuleContentEditor({ moduleId, ru, kk }: { moduleId: string; ru: SideState; kk: SideState }) {
  const [tab, setTab] = useState<'RU' | 'KK'>('RU');
  const [ruState, setRu] = useState<SideState>(ru);
  const [kkState, setKk] = useState<SideState>(kk);
  const [pending, start] = useTransition();
  const [savedTab, setSaved] = useState<'RU' | 'KK' | null>(null);

  const cur = tab === 'RU' ? ruState : kkState;
  const setCur = tab === 'RU' ? setRu : setKk;

  function save() {
    const fd = new FormData();
    fd.append('moduleId', moduleId);
    fd.append('locale', tab);
    fd.append('title', cur.title);
    fd.append('bodyHtml', cur.bodyHtml);
    start(async () => {
      await upsertModuleContent(fd);
      setSaved(tab);
      setTimeout(() => setSaved(null), 2000);
    });
  }

  return (
    <div>
      <div className="flex gap-1 mb-3 border-b">
        {(['RU', 'KK'] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setTab(l)}
            className={cn(
              'px-3 py-2 text-sm border-b-2 -mb-px transition-colors',
              tab === l ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Заголовок ({tab})</Label>
          <Input value={cur.title} onChange={(e) => setCur({ ...cur, title: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Текст ({tab})</Label>
          <TipTapEditor value={cur.bodyHtml} onChange={(html) => setCur({ ...cur, bodyHtml: html })} />
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={pending}>{pending ? 'Сохранение…' : `Сохранить ${tab}`}</Button>
          {savedTab && <span className="text-sm text-success">✓ {savedTab} сохранён</span>}
        </div>
      </div>
    </div>
  );
}
