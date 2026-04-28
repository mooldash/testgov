import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTenge(amount: number): string {
  return new Intl.NumberFormat('ru-RU').format(amount) + ' ₸';
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatDate(d: Date | string, locale: string = 'ru'): string {
  return new Intl.DateTimeFormat(locale === 'kk' ? 'kk-KZ' : 'ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(d));
}

export function formatDateTime(d: Date | string, locale: string = 'ru'): string {
  return new Intl.DateTimeFormat(locale === 'kk' ? 'kk-KZ' : 'ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(d));
}

export function pluckLocalized<T extends Record<string, unknown>>(
  obj: T,
  field: string,
  locale: 'kk' | 'ru'
): string {
  const key = locale === 'kk' ? `${field}Kk` : `${field}Ru`;
  return (obj[key] as string) ?? '';
}
