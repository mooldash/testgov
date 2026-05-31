'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, ArrowLeft, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { TipTapEditor } from '@/components/editor/TipTapEditor';
import { upsertArticle } from '@/app/admin/actions';
import { EditorRightSidebar } from './EditorRightSidebar';

type Article = {
  id: string;
  slug: string;
  titleRu: string;
  titleKk: string;
  bodyRu: string;
  bodyKk: string;
  coverUrl: string | null;
  isPublished: boolean;
  publishedAt: Date | null;
  createdAt?: Date;
};

type Lang = 'ru' | 'kk';

export function ArticleForm({
  article,
  authorRu,
  authorKk,
}: {
  article?: Article;
  authorRu: string;
  authorKk: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saving, setSaving] = useState(false);

  const [titleRu, setTitleRu] = useState(article?.titleRu ?? '');
  const [titleKk, setTitleKk] = useState(article?.titleKk ?? '');
  const [bodyRu, setBodyRu] = useState(article?.bodyRu ?? '');
  const [bodyKk, setBodyKk] = useState(article?.bodyKk ?? '');
  const [coverUrl, setCoverUrl] = useState<string>(article?.coverUrl ?? '');
  const [isPublished, setIsPublished] = useState(article?.isPublished ?? false);
  const [lang, setLang] = useState<Lang>('ru');
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const title = lang === 'ru' ? titleRu : titleKk;
  const setTitle = lang === 'ru' ? setTitleRu : setTitleKk;
  const body = lang === 'ru' ? bodyRu : bodyKk;
  const setBody = lang === 'ru' ? setBodyRu : setBodyKk;

  function markChanged() {
    setHasChanges(true);
  }

  function save() {
    setError(null);
    if (!titleRu || !titleKk) {
      setError('Заполните заголовок на обоих языках');
      return;
    }
    setSaving(true);
    startTransition(async () => {
      try {
        const fd = new FormData();
        if (article?.id) fd.set('id', article.id);
        fd.set('titleRu', titleRu);
        fd.set('titleKk', titleKk);
        fd.set('bodyRu', bodyRu);
        fd.set('bodyKk', bodyKk);
        fd.set('isPublished', isPublished ? 'true' : 'false');
        if (coverUrl) fd.set('coverUrl', coverUrl);
        await upsertArticle(fd);
        setHasChanges(false);
        router.push('/admin/news');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ошибка сохранения');
      } finally {
        setSaving(false);
      }
    });
  }

  return (
    <div className="flex flex-1 self-stretch">
      {/* CENTER */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <div className="border-b bg-background sticky top-0 z-10">
          <div className="flex items-center justify-between gap-3 px-4 md:px-6 h-14">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => router.push('/admin/news')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-sm font-medium truncate">
                {article ? 'Редактирование' : 'Новая статья'}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {hasChanges && (
                <span className="text-xs text-amber-600 hidden sm:inline">● Есть изменения</span>
              )}

              {/* Language tabs */}
              <div className="inline-flex h-8 rounded-md bg-muted p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setLang('ru')}
                  className={
                    'px-3 h-7 rounded-[5px] transition-colors ' +
                    (lang === 'ru'
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground')
                  }
                >
                  RU
                </button>
                <button
                  type="button"
                  onClick={() => setLang('kk')}
                  className={
                    'px-3 h-7 rounded-[5px] transition-colors ' +
                    (lang === 'kk'
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground')
                  }
                >
                  KK
                </button>
              </div>
              <div className="h-6 w-px bg-border" />

              {article?.id && article?.slug && (
                <a
                  href={`/ru/news/${article.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex"
                >
                  <Button variant="secondary" size="sm" className="h-8 gap-2">
                    <Eye className="h-3.5 w-3.5" />
                    Предпросмотр
                  </Button>
                </a>
              )}

              <Button variant="secondary" size="sm" className="h-8 gap-2" onClick={save} disabled={saving || pending}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">Сохранить</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                className="h-8 gap-2"
                onClick={() => router.push('/admin/news')}
              >
                <X className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Закрыть</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content area — wider center, lighter padding */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 md:px-10 lg:px-12 xl:px-16 py-6 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Заголовок
                <span className="ml-2 text-xs text-muted-foreground font-normal">
                  ({lang === 'ru' ? 'Русский' : 'Қазақша'})
                </span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => { setTitle(e.target.value); markChanged(); }}
                placeholder="Введите заголовок статьи..."
                className="text-base font-medium h-11"
              />
            </div>

            {/* Content Editor */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Содержимое
                <span className="ml-2 text-xs text-muted-foreground font-normal">
                  ({lang === 'ru' ? 'Русский' : 'Қазақша'})
                </span>
              </Label>
              <Card className="border-muted shadow-sm">
                <CardContent className="p-0">
                  <TipTapEditor
                    value={body}
                    onChange={(v) => { setBody(v); markChanged(); }}
                  />
                </CardContent>
              </Card>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      <EditorRightSidebar
        isPublished={isPublished}
        setIsPublished={(v) => { setIsPublished(v); markChanged(); }}
        authorRu={authorRu}
        authorKk={authorKk}
        coverUrl={coverUrl}
        setCoverUrl={(u) => { setCoverUrl(u); markChanged(); }}
        publishedAt={article?.publishedAt ?? null}
      />
    </div>
  );
}
