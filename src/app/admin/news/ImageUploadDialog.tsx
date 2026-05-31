'use client';

import { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ImageUploadDialog({
  open,
  onOpenChange,
  onPicked,
  mediaFiles = [],
  currentUrl,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPicked: (url: string) => void;
  mediaFiles?: string[];
  currentUrl?: string | null;
}) {
  const [imageUrl, setImageUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function uploadFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setUploadError('Файл не является изображением');
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('subdir', 'news');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) {
        setUploadError(data?.error || `Ошибка ${res.status}`);
        return;
      }
      onPicked(data.url);
      onOpenChange(false);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Сбой сети');
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function handleFileSelect() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (f) uploadFile(f);
    };
    input.click();
  }

  function pickUrl(url: string) {
    onPicked(url);
    onOpenChange(false);
    setImageUrl('');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Добавить изображение</DialogTitle>
          <DialogDescription>Загрузите файл или укажите URL.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {mediaFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Медиафайлы статьи</p>
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {mediaFiles.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => pickUrl(img)}
                    className={
                      'rounded-md overflow-hidden border-2 transition-all hover:opacity-80 ' +
                      (currentUrl === img ? 'border-foreground ring-1 ring-foreground' : 'border-border')
                    }
                  >
                    <img src={img} alt={`Медиа ${i + 1}`} className="w-full h-20 object-cover" />
                  </button>
                ))}
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">или загрузите</span>
                </div>
              </div>
            </div>
          )}

          <div
            className={
              'border-2 border-dashed rounded-lg p-6 text-center transition-colors ' +
              (dragActive
                ? 'border-foreground/50 bg-muted/50'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50')
            }
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 mx-auto text-muted-foreground mb-2 animate-spin" />
            ) : (
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            )}
            <p className="text-sm text-muted-foreground mb-2">
              {uploading ? 'Загрузка…' : 'Перетащите изображение сюда'}
            </p>
            <Button variant="outline" size="sm" onClick={handleFileSelect} disabled={uploading}>
              {uploading ? 'Загрузка…' : 'Выбрать файл'}
            </Button>
            {uploadError && <p className="mt-2 text-xs text-destructive">{uploadError}</p>}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">или</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && imageUrl) pickUrl(imageUrl);
              }}
            />
            <Button onClick={() => imageUrl && pickUrl(imageUrl)} disabled={!imageUrl}>
              Добавить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
