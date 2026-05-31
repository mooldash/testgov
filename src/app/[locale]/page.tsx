import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import {
  Target,
  Video,
  Scale,
  UserPlus,
  GraduationCap,
  Trophy,
  ChevronRight,
  Play,
  Instagram,
  Youtube,
  Send,
  Music2,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { isLocale } from '@/i18n/config';
import { prisma } from '@/lib/prisma';
import { resolveCategoryIcon } from '@/lib/category-icons';
import { JsonLd } from '@/components/seo/JsonLd';
import { TestimonialsSlider } from '@/components/site/TestimonialsSlider';

const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:3005';

// ISR: rebuild the landing in the background every 30 min. Admin actions
// that mutate landing data (categories/programs visibility) already call
// revalidatePath in src/app/admin/actions.ts so the change appears
// immediately for editors; this just protects anonymous traffic from
// re-running heavy queries per request.
export const revalidate = 1800;

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();

  const categoriesRaw = await prisma.category.findMany({
    orderBy: { order: 'asc' },
    include: {
      _count: { select: { programs: true, extraPrograms: true } },
    },
  });
  const categories = categoriesRaw.map((c) => ({
    ...c,
    _count: { programs: c._count.programs + c._count.extraPrograms },
  }));

  const features = [
    { icon: Target, key: 'questions' },
    { icon: Video, key: 'video' },
    { icon: Scale, key: 'laws' },
  ] as const;

  const steps = [
    { icon: UserPlus, key: 1 },
    { icon: Target, key: 2 },
    { icon: GraduationCap, key: 3 },
    { icon: Trophy, key: 4 },
  ];

  const testimonials = [1, 2, 3, 4, 5].map((i) => ({
    name: t(`landing.testimonial_${i}_name` as never),
    role: t(`landing.testimonial_${i}_role` as never),
    text: t(`landing.testimonial_${i}_text` as never),
  }));

  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'testgov.kz',
    url: baseUrl,
    logo: `${baseUrl}/icon.svg`,
    description: t('seo.home_description'),
    sameAs: [
      'https://instagram.com/',
      'https://t.me/',
      'https://youtube.com/',
      'https://tiktok.com/',
    ],
    areaServed: { '@type': 'Country', name: 'Kazakhstan' },
    inLanguage: ['ru', 'kk'],
  };
  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'testgov.kz',
    url: baseUrl,
    inLanguage: locale,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/${locale}/categories?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <div>
      <JsonLd data={[orgLd, websiteLd]} />

      {/* HERO */}
      <section
        className="relative overflow-hidden border-b text-white"
        style={{
          backgroundImage: "url('/hero-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(8, 27, 75, 0.78) 0%, rgba(12, 40, 100, 0.82) 60%, rgba(8, 27, 75, 0.92) 100%)',
          }}
        />
        <div className="container relative py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <Badge
              variant="outline"
              className="mb-5 border-white/40 bg-white/10 text-white backdrop-blur-sm"
            >
              {t('landing.hero_eyebrow')}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
              {t('landing.hero_title')}
            </h1>
            <p className="mt-5 text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
              {t('landing.hero_subtitle')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Link href={`/${locale}/categories`}>
                <Button
                  size="lg"
                  className="bg-white text-[#0c2864] hover:bg-white/90"
                >
                  {t('landing.cta_browse')}
                </Button>
              </Link>
              <Link href={`/${locale}/login`}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  {t('landing.cta_login')}
                </Button>
              </Link>
            </div>
          </div>

          {categories.length > 0 && (
            <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {categories.map((c) => {
                const name = locale === 'kk' ? c.nameKk : c.nameRu;
                const Icon = resolveCategoryIcon(c.iconKey, c.slug);
                return (
                  <Link
                    key={c.id}
                    href={`/${locale}/categories/${c.slug}`}
                    className="group"
                  >
                    <Card className="h-full text-center border-white/30 bg-white/10 backdrop-blur-sm transition-all group-hover:border-white/70 group-hover:bg-white/15">
                      <CardContent className="p-6 flex flex-col items-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-white mb-4 border border-white/30">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="font-semibold leading-tight text-white">
                          {name}
                        </div>
                        <div className="mt-2 text-xs text-white/70">
                          {c._count.programs} {t('categories.programs_count')}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* VIDEOS — now second section */}
      <section className="border-b bg-muted/30">
        <div className="container py-20">
          <div className="max-w-2xl mb-10">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              {t('landing.videos_title')}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {t('landing.videos_subtitle')}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="group">
                <div className="aspect-video rounded-xl border bg-card overflow-hidden flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-muted/60" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full border bg-background/80 backdrop-blur-sm transition-transform group-hover:scale-110">
                    <Play className="h-7 w-7 text-primary fill-primary" />
                  </div>
                </div>
                <h3 className="mt-4 font-semibold">{t(`landing.video_${i}_title`)}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {t(`landing.video_${i}_text`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES — 3 cards: вопросы / видеолекции / законы */}
      <section className="container py-20">
        <div className="max-w-2xl mb-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            {t('landing.features_title')}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {t('landing.features_subtitle')}
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, key }) => (
            <Card key={key} className="h-full">
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="mt-4 text-lg">
                  {t(`landing.feature_${key}_title` as never)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t(`landing.feature_${key}_text` as never)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y bg-muted/30">
        <div className="container py-20">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              {t('landing.how_title')}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {t('landing.how_subtitle')}
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map(({ icon: Icon, key }, idx) => (
              <div key={key} className="relative">
                <div className="rounded-xl border bg-card p-6 h-full">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-mono text-muted-foreground">
                      0{key}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">
                    {t(`landing.how_${key}_title`)}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {t(`landing.how_${key}_text`)}
                  </p>
                </div>
                {idx < steps.length - 1 && (
                  <ChevronRight className="hidden md:block absolute top-1/2 -right-4 h-6 w-6 -translate-y-1/2 text-muted-foreground/40" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="container py-20">
        <div className="max-w-2xl mb-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            {t('landing.testimonials_title')}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {t('landing.testimonials_subtitle')}
          </p>
        </div>
        <TestimonialsSlider items={testimonials} />
      </section>

      {/* SOCIAL */}
      <section className="border-t bg-muted/30">
        <div className="container py-20">
          <div className="max-w-2xl mb-10">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              {t('landing.social_title')}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {t('landing.social_subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { icon: MessageCircle, key: 'whatsapp', href: `https://wa.me/${(process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '+7 777 036 8696').replace(/\D/g, '')}`, accent: 'emerald' as const },
              { icon: Instagram, key: 'instagram', href: 'https://instagram.com/' },
              { icon: Send, key: 'telegram', href: 'https://t.me/' },
              { icon: Youtube, key: 'youtube', href: 'https://youtube.com/' },
              { icon: Music2, key: 'tiktok', href: 'https://tiktok.com/' },
            ].map(({ icon: Icon, key, href, accent }) => (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={
                  'group flex flex-col items-center gap-3 rounded-xl border bg-card p-6 transition-colors hover:border-primary hover:bg-muted/40 ' +
                  (accent === 'emerald' ? 'border-emerald-500/30' : '')
                }
              >
                <div className={
                  'flex h-10 w-10 items-center justify-center rounded-lg transition-colors ' +
                  (accent === 'emerald'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white'
                    : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground')
                }>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">
                  {key === 'whatsapp' ? 'WhatsApp' : t(`landing.social_${key}`)}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
