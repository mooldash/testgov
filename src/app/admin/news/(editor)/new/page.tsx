import { getSetting, SETTING_KEYS } from '@/lib/settings';
import { ArticleForm } from '../../ArticleForm';

export default async function NewArticlePage() {
  const [authorRu, authorKk] = await Promise.all([
    getSetting(SETTING_KEYS.NEWS_AUTHOR_RU),
    getSetting(SETTING_KEYS.NEWS_AUTHOR_KK),
  ]);
  return <ArticleForm authorRu={authorRu ?? ''} authorKk={authorKk ?? ''} />;
}
