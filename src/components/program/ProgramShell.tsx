import Link from 'next/link';
import { BookOpen, Target, LayoutDashboard, Award } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { dbLocale, type AppLocale } from '@/i18n/config';
import { pluckLocalized, cn } from '@/lib/utils';
import { NavGuardLink } from './NavGuardLink';

type CurrentItem =
  | { type: 'overview' }
  | { type: 'module'; id: string }
  | { type: 'test'; id: string };

export async function ProgramShell({
  programId,
  locale,
  current,
  guarded = false,
  children,
}: {
  programId: string;
  locale: AppLocale;
  current: CurrentItem;
  guarded?: boolean;
  children: React.ReactNode;
}) {
  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          module: {
            include: {
              contents: { where: { locale: dbLocale(locale) }, select: { title: true } },
              tests: {
                where: { locale: dbLocale(locale), isPublished: true },
                select: { id: true, title: true },
              },
            },
          },
        },
      },
    },
  });

  if (!program) return <>{children}</>;

  const programName = pluckLocalized(program, 'name', locale);
  const overviewHref = `/${locale}/programs/${program.slug}`;
  const isOverview = current.type === 'overview';

  return (
    <div className="flex flex-1 min-h-[calc(100vh-3.5rem)]">
      <aside className="hidden md:block w-72 shrink-0 border-r bg-muted/30">
        <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
        <div className="px-4 py-5 border-b">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            {locale === 'kk' ? 'Бағдарлама' : 'Программа'}
          </div>
          {guarded ? (
            <NavGuardLink
              href={overviewHref}
              locale={locale}
              className={cn(
                'block font-semibold leading-tight hover:text-primary transition-colors cursor-pointer',
                isOverview && 'text-primary'
              )}
            >
              {programName}
            </NavGuardLink>
          ) : (
            <Link
              href={overviewHref}
              className={cn(
                'block font-semibold leading-tight hover:text-primary transition-colors',
                isOverview && 'text-primary'
              )}
            >
              {programName}
            </Link>
          )}
        </div>

        <nav className="p-2 text-sm">
          <SidebarItem
            href={overviewHref}
            icon={<LayoutDashboard className="h-4 w-4" />}
            label={locale === 'kk' ? 'Шолу' : 'Обзор'}
            active={isOverview}
            guarded={guarded}
            locale={locale}
          />

          <div className="px-3 mt-4 mb-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            {locale === 'kk' ? 'Модульдер мен тесттер' : 'Модули и тесты'}
          </div>

          {program.modules.map((pm) => {
            const m = pm.module;
            if (m.type === 'EXAM') {
              const title =
                m.contents[0]?.title ??
                (locale === 'kk' ? 'Қорытынды емтихан' : 'Итоговый экзамен');
              // EXAM module routes via /modules/[id] which redirects to start
              const href = `/${locale}/modules/${m.id}?program=${program.id}`;
              const active = current.type === 'module' && current.id === m.id;
              return (
                <SidebarItem
                  key={m.id}
                  href={href}
                  icon={<Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
                  label={title}
                  active={active}
                  guarded={guarded}
                  locale={locale}
                />
              );
            }
            if (m.type === 'LAW') {
              const title =
                m.contents[0]?.title ?? (locale === 'kk' ? 'Оқу материалы' : 'Учебный материал');
              const href = `/${locale}/modules/${m.id}?program=${program.id}`;
              const active = current.type === 'module' && current.id === m.id;
              return (
                <SidebarItem
                  key={m.id}
                  href={href}
                  icon={<BookOpen className="h-4 w-4" />}
                  label={title}
                  active={active}
                  guarded={guarded}
                  locale={locale}
                />
              );
            }
            const localizedTest = m.tests[0];
            if (!localizedTest) return null;
            const href = `/${locale}/tests/${localizedTest.id}?program=${program.id}`;
            const active = current.type === 'test' && current.id === localizedTest.id;
            return (
              <SidebarItem
                key={m.id}
                href={href}
                icon={<Target className="h-4 w-4" />}
                label={localizedTest.title}
                active={active}
                guarded={guarded}
                locale={locale}
              />
            );
          })}
        </nav>
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}

function SidebarItem({
  href,
  icon,
  label,
  active,
  guarded,
  locale,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  guarded?: boolean;
  locale?: string;
}) {
  const className = cn(
    'flex items-start gap-2.5 px-3 py-2 rounded-md transition-colors leading-snug cursor-pointer',
    active
      ? 'bg-primary/10 text-primary border-l-2 border-primary -ml-[2px]'
      : 'hover:bg-background border-l-2 border-transparent -ml-[2px] text-foreground/80 hover:text-foreground'
  );
  const inner = (
    <>
      <span className={cn('shrink-0 mt-0.5', active ? 'text-primary' : 'text-muted-foreground')}>
        {icon}
      </span>
      <span className="line-clamp-2">{label}</span>
    </>
  );
  if (guarded) {
    return (
      <NavGuardLink href={href} className={className} locale={locale}>
        {inner}
      </NavGuardLink>
    );
  }
  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}
