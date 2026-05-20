import { redirect } from 'next/navigation';

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // Registration is now on the unified auth page (login + register side-by-side).
  redirect(`/${locale}/login`);
}
