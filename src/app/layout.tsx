import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'testgov.kz — подготовка к государственному тестированию',
  description: 'Полная подготовка к тестированию государственных служащих РК. Казахский и русский языки.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const path = h.get('x-pathname') ?? h.get('referer') ?? '';
  const lang = path.includes('/kk') ? 'kk' : 'ru';
  return (
    <html lang={lang} className={inter.variable}>
      <body className="font-sans min-h-screen bg-background">{children}</body>
    </html>
  );
}
