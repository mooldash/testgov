export type TariffKey = 'econom' | 'optima' | 'vip';

export interface Tariff {
  key: TariffKey;
  nameRu: string;
  nameKk: string;
  durationDays: number;
  priceMultiplier: number;
  recommended?: boolean;
  featuresRu: string[];
  featuresKk: string[];
}

export const TARIFFS: Tariff[] = [
  {
    key: 'econom',
    nameRu: 'Эконом',
    nameKk: 'Эконом',
    durationDays: 3,
    priceMultiplier: 0.25,
    featuresRu: [
      'Доступ ко всем тестам программы',
      'Базовая статистика прохождений',
      'Срок действия — 3 дня',
    ],
    featuresKk: [
      'Бағдарламаның барлық тесттеріне қол жетімділік',
      'Базалық статистика',
      'Қолданылу мерзімі — 3 күн',
    ],
  },
  {
    key: 'optima',
    nameRu: 'Оптима',
    nameKk: 'Оптима',
    durationDays: 10,
    priceMultiplier: 0.55,
    recommended: true,
    featuresRu: [
      'Доступ ко всем тестам программы',
      'Подробная статистика и анализ ошибок',
      'Учебные материалы и разборы',
      'Срок действия — 10 дней',
    ],
    featuresKk: [
      'Бағдарламаның барлық тесттеріне қол жетімділік',
      'Толық статистика мен қателерді талдау',
      'Оқу материалдары мен талдаулар',
      'Қолданылу мерзімі — 10 күн',
    ],
  },
  {
    key: 'vip',
    nameRu: 'VIP',
    nameKk: 'VIP',
    durationDays: 20,
    priceMultiplier: 1.0,
    featuresRu: [
      'Всё из тарифа «Оптима»',
      'Приоритетная поддержка',
      'Email-уведомления о новых тестах',
      'Расширенная аналитика прогресса',
      'Срок действия — 20 дней',
    ],
    featuresKk: [
      '«Оптима» тарифінде бар нәрсенің барлығы',
      'Басымдықты қолдау',
      'Жаңа тесттер туралы email хабарландырулар',
      'Кеңейтілген прогресс аналитикасы',
      'Қолданылу мерзімі — 20 күн',
    ],
  },
];

export function getTariff(key: string): Tariff | null {
  return TARIFFS.find((t) => t.key === key) ?? null;
}

export function computeTariffPrice(basePriceTenge: number, multiplier: number): number {
  // Round to nearest 100 ₸
  return Math.round((basePriceTenge * multiplier) / 100) * 100;
}
