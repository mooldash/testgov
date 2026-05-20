'use client';

import { useState } from 'react';
import { Database, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function BackupCard() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/backup');
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const dispo = res.headers.get('Content-Disposition') ?? '';
      const match = dispo.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : 'testgov-backup.sql';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка резервного копирования');
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Database className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-semibold">Резервная копия БД</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Скачать полный SQL-дамп всех таблиц (pg_dump). Файл можно загрузить на
                сервер командой <code className="text-xs bg-muted px-1 rounded">psql ... &lt; backup.sql</code> для восстановления.
              </p>
            </div>
          </div>
          <Button onClick={download} disabled={pending} className="shrink-0">
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Готовим…
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-1.5" />
                Скачать
              </>
            )}
          </Button>
        </div>
        {error && (
          <div className="mt-3 rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
