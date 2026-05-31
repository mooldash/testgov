'use client';

import { useState, useTransition } from 'react';
import { Switch } from '@/components/ui/switch';
import { setAppSetting } from '../actions';

export function SettingToggle({
  settingKey,
  initial,
  title,
  description,
}: {
  settingKey: string;
  initial: boolean;
  title: string;
  description: string;
}) {
  const [enabled, setEnabled] = useState(initial);
  const [pending, startTransition] = useTransition();

  function onChange(next: boolean) {
    setEnabled(next);
    startTransition(async () => {
      const fd = new FormData();
      fd.set('key', settingKey);
      fd.set('value', next ? 'true' : 'false');
      await setAppSetting(fd);
    });
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1 flex-1">
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <Switch checked={enabled} onCheckedChange={onChange} disabled={pending} />
    </div>
  );
}
