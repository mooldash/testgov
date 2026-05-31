import { prisma } from './prisma';

export const SETTING_KEYS = {
  CATEGORY_DIRECT_PROGRAM: 'category_direct_program',
  DEFAULT_RESET_PASSWORD: 'default_reset_password',
  NEWS_AUTHOR_RU: 'news_author_ru',
  NEWS_AUTHOR_KK: 'news_author_kk',
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

export async function getSetting(key: SettingKey): Promise<string | null> {
  const row = await prisma.appSetting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function getBoolSetting(key: SettingKey, defaultValue = false): Promise<boolean> {
  const v = await getSetting(key);
  if (v === null) return defaultValue;
  return v === 'true' || v === '1';
}

export async function setSetting(key: SettingKey, value: string): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await prisma.appSetting.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
