import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, locales } from '@/i18n/config';

const intl = createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
});

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Pass-through for routes that should NOT be locale-prefixed
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/uploads') ||
    pathname.startsWith('/payments/stub') ||
    pathname.startsWith('/_next') ||
    pathname === '/icon.svg' ||
    pathname === '/apple-icon' ||
    pathname === '/opengraph-image' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/manifest.webmanifest'
  ) {
    return NextResponse.next();
  }

  return intl(req);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
