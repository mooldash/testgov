'use client';

import { useState, useTransition } from 'react';
import { Star, Loader2, Trash2, Clock4 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { createOrUpdateReview, deleteOwnReview } from './reviewActions';

type ReviewItem = {
  id: string;
  rating: number;
  text: string;
  isPublished: boolean;
  createdAt: Date;
  userName: string;
  userId: string;
};

export function ReviewsSection({
  programId,
  reviews,
  currentUserId,
  canReview,
  locale,
}: {
  programId: string;
  reviews: ReviewItem[];
  currentUserId: string | null;
  canReview: boolean;
  locale: 'ru' | 'kk';
}) {
  const myReview = currentUserId ? reviews.find((r) => r.userId === currentUserId) : undefined;
  const publishedOrMine = reviews.filter((r) => r.isPublished || r.userId === currentUserId);

  const [editing, setEditing] = useState(!myReview && canReview);
  const [rating, setRating] = useState<number>(myReview?.rating ?? 5);
  const [text, setText] = useState<string>(myReview?.text ?? '');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function submit() {
    setError(null);
    setSuccess(false);
    if (text.trim().length < 10) {
      setError(locale === 'kk' ? 'Кемінде 10 таңба' : 'Минимум 10 символов');
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.set('programId', programId);
      fd.set('rating', String(rating));
      fd.set('text', text.trim());
      const res = await createOrUpdateReview(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSuccess(true);
      setEditing(false);
    });
  }

  function confirmRemove() {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    startTransition(async () => {
      const fd = new FormData();
      fd.set('id', id);
      const res = await deleteOwnReview(fd);
      if (!res.ok) {
        setError(res.error);
        setConfirmDeleteId(null);
        return;
      }
      setRating(5);
      setText('');
      setEditing(canReview);
      setConfirmDeleteId(null);
    });
  }

  const t = (k: string) => {
    const ruLabels: Record<string, string> = {
      heading: 'Отзывы',
      writeOne: 'Оставить отзыв',
      yourReview: 'Ваш отзыв',
      moderation: 'на модерации',
      published: 'опубликован',
      submit: 'Отправить',
      saving: 'Сохраняю…',
      edit: 'Изменить',
      delete: 'Удалить',
      cancel: 'Отмена',
      rating: 'Оценка',
      text: 'Текст отзыва',
      empty: 'Пока нет отзывов. Будьте первым!',
      noAccess: 'Оставлять отзывы могут владельцы программы.',
      successCreated: 'Спасибо! Отзыв отправлен на модерацию.',
    };
    const kkLabels: Record<string, string> = {
      heading: 'Пікірлер',
      writeOne: 'Пікір қалдыру',
      yourReview: 'Сіздің пікіріңіз',
      moderation: 'модерацияда',
      published: 'жарияланды',
      submit: 'Жіберу',
      saving: 'Сақталуда…',
      edit: 'Өзгерту',
      delete: 'Жою',
      cancel: 'Болдырмау',
      rating: 'Бағалау',
      text: 'Пікір мәтіні',
      empty: 'Әзірге пікірлер жоқ. Бірінші болыңыз!',
      noAccess: 'Бағдарлама иелері ғана пікір қалдыра алады.',
      successCreated: 'Рахмет! Пікір модерацияға жіберілді.',
    };
    return (locale === 'kk' ? kkLabels : ruLabels)[k] ?? k;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl md:text-2xl font-semibold">{t('heading')}</h2>

      {canReview && (
        <Card>
          <CardContent className="pt-6">
            {!editing && myReview ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{t('yourReview')}</span>
                    {myReview.isPublished ? (
                      <Badge variant="success" className="gap-1">
                        {t('published')}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <Clock4 className="h-3 w-3" /> {t('moderation')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                      {t('edit')}
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setConfirmDeleteId(myReview.id)}>
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> {t('delete')}
                    </Button>
                  </div>
                </div>
                <Stars value={myReview.rating} />
                <p className="text-sm leading-relaxed">{myReview.text}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm font-medium">{myReview ? t('yourReview') : t('writeOne')}</div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">{t('rating')}</div>
                  <StarsInput value={rating} onChange={setRating} disabled={pending} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">{t('text')}</div>
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={
                      locale === 'kk'
                        ? 'Бағдарлама туралы ой-пікіріңіз...'
                        : 'Ваши впечатления о программе...'
                    }
                    rows={4}
                    disabled={pending}
                    maxLength={2000}
                  />
                </div>
                {error && (
                  <div className="rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2">{error}</div>
                )}
                {success && (
                  <div className="rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-sm px-3 py-2">
                    {t('successCreated')}
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  {myReview && (
                    <Button size="sm" variant="outline" disabled={pending} onClick={() => setEditing(false)}>
                      {t('cancel')}
                    </Button>
                  )}
                  <Button size="sm" disabled={pending} onClick={submit}>
                    {pending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> {t('saving')}
                      </>
                    ) : (
                      t('submit')
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!canReview && !myReview && (
        <p className="text-sm text-muted-foreground">{t('noAccess')}</p>
      )}

      <div className="space-y-3">
        {publishedOrMine.length === 0 && (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        )}
        {publishedOrMine.map((r) => (
          <Card key={r.id}>
            <CardContent className="pt-5 space-y-2">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-medium text-sm">{r.userName}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat(locale === 'kk' ? 'kk-KZ' : 'ru-RU', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    }).format(new Date(r.createdAt))}
                  </div>
                </div>
                <Stars value={r.rating} />
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{r.text}</p>
              {!r.isPublished && r.userId === currentUserId && (
                <Badge variant="secondary" className="gap-1">
                  <Clock4 className="h-3 w-3" /> {t('moderation')}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={confirmDeleteId !== null} onOpenChange={(v) => !v && setConfirmDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{locale === 'kk' ? 'Пікірді жою' : 'Удалить отзыв'}</DialogTitle>
            <DialogDescription>
              {locale === 'kk'
                ? 'Пікіріңіз қайтарылмастай жойылады. Жалғастыру керек пе?'
                : 'Ваш отзыв будет удалён без возможности восстановления. Продолжить?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" disabled={pending} onClick={() => setConfirmDeleteId(null)}>
              {t('cancel')}
            </Button>
            <Button variant="destructive" size="sm" disabled={pending} onClick={confirmRemove}>
              {pending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1.5" />}
              {t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            'h-4 w-4',
            n <= value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
          )}
        />
      ))}
    </div>
  );
}

function StarsInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? value;
  return (
    <div className="inline-flex gap-1" onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          aria-label={`${n}`}
          className="p-0.5"
        >
          <Star
            className={cn(
              'h-6 w-6 transition-colors',
              n <= active ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40 hover:text-amber-300'
            )}
          />
        </button>
      ))}
    </div>
  );
}
