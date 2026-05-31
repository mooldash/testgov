'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setAppSetting } from '../actions';

export function SettingText({
  settingKey,
  initial,
  title,
  description,
  placeholder,
}: {
  settingKey: string;
  initial: string;
  title: string;
  description: string;
  placeholder?: string;
}) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef(initial);

  useEffect(() => {
    if (value === lastSavedRef.current) return;
    setSaved(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setPending(true);
      const fd = new FormData();
      fd.set('key', settingKey);
      fd.set('value', value);
      await setAppSetting(fd);
      lastSavedRef.current = value;
      setPending(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }, 600);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, settingKey]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={settingKey} className="text-sm font-medium">
          {title}
        </Label>
        <span className="text-xs text-muted-foreground inline-flex items-center gap-1 h-4">
          {pending && <Loader2 className="h-3 w-3 animate-spin" />}
          {saved && (
            <>
              <Check className="h-3 w-3 text-emerald-600" /> сохранено
            </>
          )}
        </span>
      </div>
      <Input
        id={settingKey}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="max-w-sm font-mono"
      />
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
