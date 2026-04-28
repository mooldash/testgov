export const locales = ['kk', 'ru'] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = 'ru';

export function isLocale(value: string | undefined): value is AppLocale {
  return value === 'kk' || value === 'ru';
}

export function dbLocale(locale: AppLocale): 'KK' | 'RU' {
  return locale === 'kk' ? 'KK' : 'RU';
}
