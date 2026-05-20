import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:3005';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, programs] = await Promise.all([
    prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.program.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/ru`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: {
        languages: { ru: `${baseUrl}/ru`, kk: `${baseUrl}/kk` },
      },
    },
    {
      url: `${baseUrl}/kk`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: {
        languages: { ru: `${baseUrl}/ru`, kk: `${baseUrl}/kk` },
      },
    },
    {
      url: `${baseUrl}/ru/categories`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: {
        languages: {
          ru: `${baseUrl}/ru/categories`,
          kk: `${baseUrl}/kk/categories`,
        },
      },
    },
    {
      url: `${baseUrl}/kk/categories`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: {
        languages: {
          ru: `${baseUrl}/ru/categories`,
          kk: `${baseUrl}/kk/categories`,
        },
      },
    },
    {
      url: `${baseUrl}/ru/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/kk/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.flatMap((c) => [
    {
      url: `${baseUrl}/ru/categories/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: {
        languages: {
          ru: `${baseUrl}/ru/categories/${c.slug}`,
          kk: `${baseUrl}/kk/categories/${c.slug}`,
        },
      },
    },
    {
      url: `${baseUrl}/kk/categories/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: {
        languages: {
          ru: `${baseUrl}/ru/categories/${c.slug}`,
          kk: `${baseUrl}/kk/categories/${c.slug}`,
        },
      },
    },
  ]);

  const programRoutes: MetadataRoute.Sitemap = programs.flatMap((p) => [
    {
      url: `${baseUrl}/ru/programs/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
      alternates: {
        languages: {
          ru: `${baseUrl}/ru/programs/${p.slug}`,
          kk: `${baseUrl}/kk/programs/${p.slug}`,
        },
      },
    },
    {
      url: `${baseUrl}/kk/programs/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
      alternates: {
        languages: {
          ru: `${baseUrl}/ru/programs/${p.slug}`,
          kk: `${baseUrl}/kk/programs/${p.slug}`,
        },
      },
    },
  ]);

  return [...staticRoutes, ...categoryRoutes, ...programRoutes];
}
