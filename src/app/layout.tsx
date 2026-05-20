import type { Metadata, Viewport } from 'next';
import { getLocale } from 'next-intl/server';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-sans' });

const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:3005';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'testgov.kz — подготовка к государственному тестированию РК',
    template: '%s | testgov.kz',
  },
  description:
    'Полная подготовка к тестированию государственных служащих и правоохранительных органов РК. Тесты на казахском и русском, реалистичный движок, история попыток.',
  applicationName: 'testgov.kz',
  keywords: [
    'тесты госслужбы',
    'подготовка к ЕНТ для госслужащих',
    'testgov',
    'мемлекеттік қызмет тесттері',
    'правоохранительная служба',
    'тестирование Казахстан',
    'госслужба РК',
    'подготовка к тестам АГС',
  ],
  authors: [{ name: 'testgov.kz' }],
  creator: 'testgov.kz',
  publisher: 'testgov.kz',
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: 'website',
    siteName: 'testgov.kz',
    title: 'testgov.kz — подготовка к государственному тестированию РК',
    description:
      'Полный набор тестов на казахском и русском с реалистичной симуляцией экзамена.',
    url: baseUrl,
    locale: 'ru_RU',
    alternateLocale: ['kk_KZ'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'testgov.kz — подготовка к государственному тестированию РК',
    description:
      'Полный набор тестов на казахском и русском с реалистичной симуляцией экзамена.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={inter.variable}>
      <body className="font-sans min-h-screen bg-background">{children}</body>
    </html>
  );
}
