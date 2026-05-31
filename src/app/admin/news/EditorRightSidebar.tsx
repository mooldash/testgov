'use client';

import { useState } from 'react';
import {
  Sparkles,
  Calendar as CalendarIcon,
  Clock,
  Image as ImageIcon,
  Trash2,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ImageUploadDialog } from './ImageUploadDialog';

export function EditorRightSidebar({
  isPublished,
  setIsPublished,
  authorRu,
  authorKk,
  coverUrl,
  setCoverUrl,
  publishedAt,
}: {
  isPublished: boolean;
  setIsPublished: (v: boolean) => void;
  authorRu: string;
  authorKk: string;
  coverUrl: string;
  setCoverUrl: (s: string) => void;
  publishedAt?: Date | null;
}) {
  const [showImageModal, setShowImageModal] = useState(false);

  return (
    <aside className="w-72 shrink-0 border-l bg-muted/30 hidden lg:flex flex-col self-stretch">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Инструменты</h2>
            <p className="text-xs text-muted-foreground">Редактирование</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4 pb-6 space-y-6">
          {/* Status — single dropdown, just two states */}
          <Block label="Статус">
            <select
              value={isPublished ? 'PUBLISHED' : 'DRAFT'}
              onChange={(e) => setIsPublished(e.target.value === 'PUBLISHED')}
              className="w-full h-9 text-sm rounded-md border border-input bg-background px-3"
            >
              <option value="DRAFT">Не опубликовано</option>
              <option value="PUBLISHED">Опубликовано</option>
            </select>
          </Block>

          <Separator />

          {/* Author — read-only, value comes from /admin/settings */}
          <Block label="Автор">
            <div className="rounded-md border bg-background/60 px-3 py-2 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-mono">RU</span>
                <Lock className="h-3 w-3" />
              </div>
              <div className="text-sm">{authorRu || '— не задан в настройках'}</div>
              <div className="h-px bg-border my-1" />
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-mono">KK</span>
                <Lock className="h-3 w-3" />
              </div>
              <div className="text-sm">{authorKk || '— не задан в настройках'}</div>
            </div>
            <a
              href="/admin/settings"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              Изменить в настройках →
            </a>
          </Block>

          <Separator />

          {/* Cover Image */}
          <Block label="Обложка" iconLeft={<Sparkles className="h-3.5 w-3.5 text-muted-foreground" />}>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-auto py-2.5 px-3"
              onClick={() => setShowImageModal(true)}
            >
              <ImageIcon className="h-4 w-4 mr-3" />
              <div className="flex-1 text-left">
                <div className="text-sm font-medium">Изображение</div>
                <div className="text-xs text-muted-foreground">
                  {coverUrl ? 'Изменить' : 'Добавить обложку'}
                </div>
              </div>
            </Button>

            {coverUrl && (
              <div className="relative rounded-lg overflow-hidden border group">
                <img
                  src={coverUrl}
                  alt="cover"
                  className="w-full h-36 object-cover group-hover:opacity-90 transition-opacity"
                />
                <button
                  type="button"
                  onClick={() => setCoverUrl('')}
                  className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full bg-background/90 border shadow-sm text-destructive hover:bg-destructive hover:text-destructive-foreground inline-flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Убрать обложку"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </Block>

          <Separator />

          {/* Published date only */}
          <Block
            label="Опубликована"
            iconLeft={<CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />}
          >
            <div className="rounded-lg bg-background/60 border p-3">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm">{formatDate(publishedAt)}</span>
              </div>
            </div>
          </Block>
        </div>
      </div>

      <ImageUploadDialog
        open={showImageModal}
        onOpenChange={setShowImageModal}
        onPicked={(url) => setCoverUrl(url)}
        currentUrl={coverUrl}
      />
    </aside>
  );
}

function Block({
  label,
  iconLeft,
  children,
}: {
  label: string;
  iconLeft?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        {iconLeft}
        {label}
      </Label>
      {children}
    </div>
  );
}

function Separator() {
  return <div className="h-px bg-border" />;
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return 'не опубликована';
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Almaty',
  }).format(new Date(d));
}
