import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSetting, SETTING_KEYS } from '@/lib/settings';
import { ArticleForm } from '../../ArticleForm';

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [article, authorRu, authorKk] = await Promise.all([
    prisma.article.findUnique({ where: { id } }),
    getSetting(SETTING_KEYS.NEWS_AUTHOR_RU),
    getSetting(SETTING_KEYS.NEWS_AUTHOR_KK),
  ]);
  if (!article) notFound();

  return (
    <ArticleForm
      authorRu={authorRu ?? ''}
      authorKk={authorKk ?? ''}
      article={{
        id: article.id,
        slug: article.slug,
        titleRu: article.titleRu,
        titleKk: article.titleKk,
        bodyRu: article.bodyRu,
        bodyKk: article.bodyKk,
        coverUrl: article.coverUrl,
        isPublished: article.isPublished,
        publishedAt: article.publishedAt,
        createdAt: article.createdAt,
      }}
    />
  );
}
