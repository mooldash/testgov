'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Item = {
  name: string;
  role: string;
  text: string;
};

export function TestimonialsSlider({ items }: { items: Item[] }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(3);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function pick() {
      if (window.innerWidth < 640) setVisible(1);
      else if (window.innerWidth < 1024) setVisible(2);
      else setVisible(3);
    }
    pick();
    window.addEventListener('resize', pick);
    return () => window.removeEventListener('resize', pick);
  }, []);

  const maxIndex = Math.max(0, items.length - visible);

  const go = useCallback(
    (to: number) => {
      setIndex(Math.max(0, Math.min(to, maxIndex)));
    },
    [maxIndex]
  );

  const next = useCallback(() => {
    setIndex((i) => (i >= maxIndex ? 0 : i + 1));
  }, [maxIndex]);

  const prev = useCallback(() => {
    setIndex((i) => (i <= 0 ? maxIndex : i - 1));
  }, [maxIndex]);

  useEffect(() => {
    autoplayRef.current = setInterval(() => {
      setIndex((i) => (i >= maxIndex ? 0 : i + 1));
    }, 6000);
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [maxIndex]);

  function pauseAutoplay() {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
  }

  // Width per card depends on visible count
  const cardBasis = `${100 / visible}%`;
  const offset = `${index * (100 / visible)}%`;

  return (
    <div className="relative" onMouseEnter={pauseAutoplay} onTouchStart={pauseAutoplay}>
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${offset})` }}
        >
          {items.map((it, idx) => (
            <div
              key={idx}
              className="shrink-0 px-3 first:pl-0"
              style={{ flexBasis: cardBasis, maxWidth: cardBasis }}
            >
              <div className="h-full rounded-2xl border bg-card p-6 flex flex-col">
                <Quote className="h-6 w-6 text-primary/30 mb-3" />
                <div className="inline-flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-foreground flex-1">
                  {it.text}
                </p>
                <div className="mt-5 pt-4 border-t">
                  <div className="font-semibold text-sm">{it.name}</div>
                  <div className="text-xs text-muted-foreground">{it.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`Страница ${i + 1}`}
              className={
                'h-2 rounded-full transition-all ' +
                (i === index ? 'w-8 bg-primary' : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50')
              }
            />
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={prev}
            aria-label="Назад"
            className="h-9 w-9 rounded-full"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={next}
            aria-label="Вперёд"
            className="h-9 w-9 rounded-full"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
