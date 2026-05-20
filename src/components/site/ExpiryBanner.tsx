import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { pluckLocalized } from '@/lib/utils';
import type { AppLocale } from '@/i18n/config';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
// Don't bug users about accesses that expired more than ~30 days ago — they
// have probably moved on or already renewed.
const STALE_AFTER_MS = 30 * ONE_DAY_MS;

export async function ExpiryBanner({ locale }: { locale: AppLocale }) {
  const session = await auth();
  if (!session?.user) return null;

  const now = new Date();
  const soonCutoff = new Date(now.getTime() + ONE_DAY_MS);
  const staleCutoff = new Date(now.getTime() - STALE_AFTER_MS);

  // Pull all accesses that are either already expired (but not too long ago)
  // OR expiring within the next 24h. Ordered so the LATEST one per program
  // comes first when grouped.
  const candidates = await prisma.userAccess.findMany({
    where: {
      userId: session.user.id,
      expiresAt: { lte: soonCutoff, gte: staleCutoff },
    },
    include: { program: { select: { slug: true, nameRu: true, nameKk: true } } },
    orderBy: [{ programId: 'asc' }, { expiresAt: 'desc' }],
  });

  // If there's a more recent access for the same program that's still healthy
  // (expires later than soonCutoff), we shouldn't nag about the old one.
  const ongoingProgramIds = new Set(
    (
      await prisma.userAccess.findMany({
        where: { userId: session.user.id, expiresAt: { gt: soonCutoff } },
        select: { programId: true },
      })
    ).map((a) => a.programId)
  );

  // Pick the latest access per program (first occurrence given ordering)
  const seen = new Set<string>();
  const issues: typeof candidates = [];
  for (const a of candidates) {
    if (ongoingProgramIds.has(a.programId)) continue;
    if (seen.has(a.programId)) continue;
    seen.add(a.programId);
    issues.push(a);
  }
  // Sort: expired first (earliest expiry first), then about-to-expire by soonest
  issues.sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime());

  if (issues.length === 0) return null;

  const labels = {
    ru: {
      verb_active: 'истекает',
      verb_expired: 'истёк',
      lessHour: 'менее чем через час',
      through: 'через',
      ago: 'назад',
      hoursWord: (n: number) => {
        const last = n % 10;
        const lastTwo = n % 100;
        if (lastTwo >= 11 && lastTwo <= 14) return 'часов';
        if (last === 1) return 'час';
        if (last >= 2 && last <= 4) return 'часа';
        return 'часов';
      },
      daysWord: (n: number) => {
        const last = n % 10;
        const lastTwo = n % 100;
        if (lastTwo >= 11 && lastTwo <= 14) return 'дней';
        if (last === 1) return 'день';
        if (last >= 2 && last <= 4) return 'дня';
        return 'дней';
      },
      renew: 'Продлить',
      multi: (n: number) => `и ещё ${n}`,
    },
    kk: {
      verb_active: 'аяқталады',
      verb_expired: 'аяқталды',
      lessHour: 'бір сағаттан аз уақытта',
      through: '',
      ago: 'бұрын',
      hoursWord: () => 'сағат',
      daysWord: () => 'күн',
      renew: 'Жалғастыру',
      multi: (n: number) => `және тағы ${n}`,
    },
  } as const;
  const L = labels[locale];

  const primary = issues[0];
  const restCount = issues.length - 1;
  const programName = pluckLocalized(primary.program, 'name', locale);
  const diffMs = primary.expiresAt.getTime() - now.getTime();
  const isExpired = diffMs < 0;

  let timePhrase: string;
  if (isExpired) {
    const daysAgo = Math.max(1, Math.floor(-diffMs / ONE_DAY_MS));
    timePhrase = `${daysAgo} ${L.daysWord(daysAgo)} ${L.ago}`;
  } else {
    const hours = Math.max(0, Math.floor(diffMs / (60 * 60 * 1000)));
    timePhrase = hours < 1 ? L.lessHour : `${L.through} ${hours} ${L.hoursWord(hours)}`.trim();
  }

  return (
    <div className="bg-destructive text-destructive-foreground">
      <div className="container flex items-center justify-between gap-4 py-2 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="truncate">
            <span className="font-medium">«{programName}»</span>{' '}
            {isExpired ? L.verb_expired : L.verb_active} {timePhrase}
            {restCount > 0 && (
              <span className="opacity-80"> · {L.multi(restCount)}</span>
            )}
          </span>
        </div>
        <Link
          href={`/${locale}/programs/${primary.program.slug}`}
          className="shrink-0 inline-flex items-center rounded-md bg-white/15 px-2.5 py-1 text-xs font-medium hover:bg-white/25 transition-colors"
        >
          {L.renew}
        </Link>
      </div>
    </div>
  );
}
