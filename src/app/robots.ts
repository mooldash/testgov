import type { MetadataRoute } from 'next';

const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:3005';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/api/',
          '/ru/dashboard',
          '/kk/dashboard',
          '/ru/dashboard/',
          '/kk/dashboard/',
          '/ru/tests/',
          '/kk/tests/',
          '/ru/modules/',
          '/kk/modules/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
