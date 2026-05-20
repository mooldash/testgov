import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Item = {
  href: string;
  label: string;
  sublabel?: string;
  active?: boolean;
};

export function ContextSidebar({
  title,
  backHref,
  backLabel,
  items,
}: {
  title: string;
  backHref?: string;
  backLabel?: string;
  items: Item[];
}) {
  return (
    <aside className="w-60 shrink-0 hidden lg:block">
      <div className="sticky top-0 max-h-[calc(100vh-3.5rem)] overflow-y-auto pr-2">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground mb-3"
          >
            ← {backLabel}
          </Link>
        )}
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 px-2">
          {title}
        </div>
        <nav className="space-y-0.5">
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                'flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                it.active
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-foreground/80 hover:bg-muted hover:text-foreground'
              )}
            >
              <span className="line-clamp-1">
                {it.label}
                {it.sublabel && (
                  <span className="ml-1.5 text-xs text-muted-foreground">{it.sublabel}</span>
                )}
              </span>
              {it.active && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
