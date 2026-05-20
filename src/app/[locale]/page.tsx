import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import {
  BookOpen,
  Clock,
  Languages,
  ListChecks,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Repeat,
  Eye,
  LayoutList,
  UserPlus,
  Target,
  GraduationCap,
  Trophy,
  ChevronRight,
  Briefcase,
  Shield,
  Calculator,
  Brain,
  Folder,
  Play,
  Instagram,
  Youtube,
  Send,
  Music2,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { isLocale } from '@/i18n/config';
import { prisma } from '@/lib/prisma';
import { JsonLd } from '@/components/seo/JsonLd';

const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:3005';

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();

  const categories = await prisma.category.findMany({
    orderBy: { order: 'asc' },
    take: 4,
    include: { _count: { select: { programs: true } } },
  });

  const categoryIcons: Record<string, LucideIcon> = {
    administrative: Briefcase,
    'law-enforcement': Shield,
    numerical: Calculator,
    'personal-qualities': Brain,
  };

  const featureIcons = [BookOpen, Sparkles, Languages, GraduationCap, ListChecks, ShieldCheck];

  const modes = [
    { icon: Clock, key: 'classic' },
    { icon: Repeat, key: 'back' },
    { icon: Eye, key: 'instant' },
    { icon: LayoutList, key: 'all' },
  ] as const;

  const steps = [
    { icon: UserPlus, key: 1 },
    { icon: Target, key: 2 },
    { icon: GraduationCap, key: 3 },
    { icon: Trophy, key: 4 },
  ];

  const stats = [1, 2, 3, 4] as const;
  const faqItems = [1, 2, 3, 4, 5] as const;

  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'testgov.kz',
    url: baseUrl,
    logo: `${baseUrl}/icon`,
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
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((n) => ({
      '@type': 'Question',
      name: t(`landing.faq_q_${n}` as never),
      acceptedAnswer: { '@type': 'Answer', text: t(`landing.faq_a_${n}` as never) },
    })),
  };

  return (
    <div>
      <JsonLd data={[orgLd, websiteLd, faqLd]} />
      {/* HERO */}
      <section
        className="relative overflow-hidden border-b text-white"
        style={{
          backgroundImage: "url('/hero-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* dark-blue overlay */}
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
            <div className="mt-8 flex flex-wrap gap-2 justify-center">
              <Badge variant="outline" className="border-white/40 text-white">
                {t('landing.hero_chip_1')}
              </Badge>
              <Badge variant="outline" className="border-white/40 text-white">
                {t('landing.hero_chip_2')}
              </Badge>
              <Badge variant="outline" className="border-white/40 text-white">
                {t('landing.hero_chip_3')}
              </Badge>
            </div>
          </div>

          {categories.length > 0 && (
            <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {categories.map((c) => {
                const name = locale === 'kk' ? c.nameKk : c.nameRu;
                const Icon = categoryIcons[c.slug] ?? Folder;
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

      {/* STATS */}
      <section className="border-b bg-muted/30">
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((i) => (
              <div key={i} className="text-center md:text-left">
                <div className="text-3xl md:text-4xl font-bold tracking-tight">
                  {t(`landing.stat_${i}_value`)}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {t(`landing.stat_${i}_label`)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container py-20">
        <div className="max-w-2xl mb-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            {t('landing.features_title')}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {t('landing.features_subtitle')}
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => {
            const Icon = featureIcons[i - 1];
            return (
              <Card key={i} className="h-full">
                <CardHeader>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="mt-4 text-lg">
                    {t(`landing.feature_${i}_title`)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(`landing.feature_${i}_text`)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* TEST MODES */}
      <section className="border-y bg-muted/30">
        <div className="container py-20">
          <div className="max-w-2xl mb-10">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              {t('landing.modes_title')}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {t('landing.modes_subtitle')}
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {modes.map(({ icon: Icon, key }) => (
              <Card key={key}>
                <CardHeader className="flex-row items-start gap-4 space-y-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {t(`landing.mode_${key}_title`)}
                    </CardTitle>
                    <CardDescription className="mt-1.5">
                      {t(`landing.mode_${key}_text`)}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container py-20">
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
      </section>

      {/* VIDEOS */}
      <section className="border-y bg-muted/30">
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
                  {/* TODO: replace with <iframe src="https://www.youtube.com/embed/<VIDEO_ID>" allow="..." className="w-full h-full" /> */}
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

      {/* FAQ */}
      <section className="container py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-center">
            {t('landing.faq_title')}
          </h2>
          <div className="mt-10 divide-y rounded-xl border bg-card">
            {faqItems.map((i) => (
              <details key={i} className="group">
                <summary className="cursor-pointer list-none px-6 py-5 flex items-center justify-between gap-4 font-medium hover:bg-muted/40 transition-colors">
                  <span>{t(`landing.faq_q_${i}`)}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-6 pb-5 text-muted-foreground leading-relaxed">
                  {t(`landing.faq_a_${i}`)}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL */}
      <section className="border-t">
        <div className="container py-20">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              {t('landing.social_title')}
            </h2>
            <p className="mt-3 text-muted-foreground">
              {t('landing.social_subtitle')}
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { icon: Instagram, key: 'instagram', href: 'https://instagram.com/' },
              { icon: Send, key: 'telegram', href: 'https://t.me/' },
              { icon: Youtube, key: 'youtube', href: 'https://youtube.com/' },
              { icon: Music2, key: 'tiktok', href: 'https://tiktok.com/' },
            ].map(({ icon: Icon, key, href }) => (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-6 transition-colors hover:border-primary hover:bg-muted/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">
                  {t(`landing.social_${key}`)}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t">
        <div className="container py-20">
          <Card className="overflow-hidden">
            <CardContent className="p-8 md:p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <TimerReset className="h-6 w-6" />
              </div>
              <h2 className="mt-6 text-3xl md:text-4xl font-bold tracking-tight">
                {t('landing.final_cta_title')}
              </h2>
              <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
                {t('landing.final_cta_subtitle')}
              </p>
              <div className="my-8 mx-auto h-px max-w-xs bg-border" />
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link href={`/${locale}/register`}>
                  <Button size="lg">{t('landing.final_cta_button')}</Button>
                </Link>
                <Link href={`/${locale}/categories`}>
                  <Button size="lg" variant="outline">
                    {t('landing.final_cta_secondary')}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
