import { MessageCircle } from 'lucide-react';
import type { AppLocale } from '@/i18n/config';

const SUPPORT_NUMBER = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '+7 777 036 8696';

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').replace(/^8/, '7');
  if (digits.length !== 11 || !digits.startsWith('7')) return raw;
  return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`;
}

export function SupportLink({ locale }: { locale: AppLocale }) {
  const phone = formatPhone(SUPPORT_NUMBER);
  const greeting =
    locale === 'kk'
      ? 'Сәлеметсіз бе! testgov.kz бойынша сұрағым бар'
      : 'Здравствуйте! Вопрос по testgov.kz';
  const href = `https://wa.me/${SUPPORT_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(greeting)}`;
  const desktopLabel = locale === 'kk' ? 'Сұрағыңыз бар ма?' : 'Есть вопросы?';

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className="group inline-flex items-center gap-2 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 px-3 h-9 transition-colors"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
        <MessageCircle className="h-3.5 w-3.5" />
      </span>
      <span className="hidden md:inline-flex items-baseline gap-1.5 text-sm">
        <span className="text-muted-foreground">{desktopLabel}</span>
        <span className="font-semibold text-foreground tabular-nums whitespace-nowrap">{phone}</span>
      </span>
    </a>
  );
}
