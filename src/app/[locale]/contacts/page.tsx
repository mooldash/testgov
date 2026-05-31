import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';
import { isLocale } from '@/i18n/config';
import { Card, CardContent } from '@/components/ui/card';

const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '+7 777 036 8696';
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@testgov.kz';
const SUPPORT_ADDRESS_RU =
  process.env.NEXT_PUBLIC_OFFICE_ADDRESS_RU || 'г. Астана, пр. Кабанбай батыра, 53';
const SUPPORT_ADDRESS_KK =
  process.env.NEXT_PUBLIC_OFFICE_ADDRESS_KK || 'Астана қ., Қабанбай батыр даң., 53';

// Map embed. By default uses Google Maps (works in iframe everywhere).
// To switch to a real 2GIS widget:
//   1. Open https://widgets.2gis.com/business-tools/widget-maker
//   2. Configure point/firm, copy iframe src
//   3. Set NEXT_PUBLIC_2GIS_IFRAME to that URL
const MAP_IFRAME_URL =
  process.env.NEXT_PUBLIC_2GIS_IFRAME ||
  'https://maps.google.com/maps?q=51.128201%2C71.430411&z=14&output=embed';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const isKk = locale === 'kk';
  return {
    title: isKk ? 'Байланыс' : 'Контакты',
    description: isKk
      ? 'testgov.kz байланыс ақпараты: телефон, электрондық пошта, кеңсе мекенжайы.'
      : 'Контактная информация testgov.kz: телефон, e-mail, адрес офиса.',
    alternates: {
      canonical: `/${locale}/contacts`,
      languages: { ru: '/ru/contacts', kk: '/kk/contacts', 'x-default': '/ru/contacts' },
    },
  };
}

export default async function ContactsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const isKk = locale === 'kk';
  const address = isKk ? SUPPORT_ADDRESS_KK : SUPPORT_ADDRESS_RU;
  const waNumber = SUPPORT_PHONE.replace(/\D/g, '');
  const waText = isKk ? 'Сәлеметсіз бе! testgov.kz сұрағым бар' : 'Здравствуйте! Вопрос по testgov.kz';
  const waHref = `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`;

  return (
    <div className="container py-12">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
        {isKk ? 'Байланыс' : 'Контакты'}
      </h1>
      <p className="text-muted-foreground mb-10 max-w-2xl">
        {isKk
          ? 'Сұрақтарыңыз бойынша бізге хабарласыңыз — WhatsApp немесе e-mail арқылы жауап береміз.'
          : 'Свяжитесь с нами по любому вопросу — отвечаем в WhatsApp или на e-mail в течение рабочего дня.'}
      </p>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <ContactCard
          icon={<Phone className="h-5 w-5" />}
          label={isKk ? 'Телефон' : 'Телефон'}
          value={SUPPORT_PHONE}
          href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`}
        />
        <ContactCard
          icon={<MessageCircle className="h-5 w-5" />}
          label="WhatsApp"
          value={SUPPORT_PHONE}
          href={waHref}
          external
          accent="emerald"
        />
        <ContactCard
          icon={<Mail className="h-5 w-5" />}
          label="E-mail"
          value={SUPPORT_EMAIL}
          href={`mailto:${SUPPORT_EMAIL}`}
        />
        <ContactCard
          icon={<MapPin className="h-5 w-5" />}
          label={isKk ? 'Кеңсе' : 'Офис'}
          value={address}
        />
      </div>

      <Card>
        <CardContent className="pt-5 px-5 pb-5 space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {isKk ? 'Жұмыс уақыты' : 'Часы работы'}: {isKk ? 'Дс–Жм, 09:00–18:00' : 'Пн–Пт, 09:00–18:00'}
          </div>
        </CardContent>
      </Card>

      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-3">{isKk ? 'Картадан табу' : 'Найти на карте'}</h2>
        <div className="aspect-[16/9] md:aspect-[21/9] rounded-xl overflow-hidden border bg-muted">
          <iframe
            src={MAP_IFRAME_URL}
            className="w-full h-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="map"
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {isKk
            ? 'Карта (NEXT_PUBLIC_2GIS_IFRAME арқылы 2GIS виджет-кодын қойыңыз)'
            : 'Карта (через NEXT_PUBLIC_2GIS_IFRAME можно подставить виджет-код 2GIS)'}
        </p>
      </div>
    </div>
  );
}

function ContactCard({
  icon,
  label,
  value,
  href,
  external,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
  accent?: 'emerald';
}) {
  const inner = (
    <Card className={accent === 'emerald' ? 'border-emerald-500/40 bg-emerald-500/5' : ''}>
      <CardContent className="pt-5 px-5 pb-5">
        <div className="flex items-start gap-3">
          <span
            className={
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ' +
              (accent === 'emerald' ? 'bg-emerald-500 text-white' : 'bg-primary/10 text-primary')
            }
          >
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="font-medium break-words">{value}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
  if (!href) return inner;
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="block hover:opacity-90 transition-opacity"
    >
      {inner}
    </a>
  );
}
