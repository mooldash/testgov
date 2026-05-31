'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasProgramAccess } from '@/lib/access';

const ReviewSchema = z.object({
  programId: z.string(),
  rating: z.coerce.number().int().min(1).max(5),
  text: z.string().min(10).max(2000),
});

export async function createOrUpdateReview(formData: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'Нужно войти в аккаунт' };

  const parsed = ReviewSchema.safeParse({
    programId: formData.get('programId'),
    rating: formData.get('rating'),
    text: formData.get('text'),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Проверьте поля',
    };
  }
  const { programId, rating, text } = parsed.data;

  const allowed = await hasProgramAccess(session.user.id, programId);
  if (!allowed) return { ok: false, error: 'Доступ к программе не активен' };

  await prisma.review.upsert({
    where: { userId_programId: { userId: session.user.id, programId } },
    create: { userId: session.user.id, programId, rating, text, isPublished: false },
    update: { rating, text, isPublished: false }, // re-moderate on edit
  });

  const program = await prisma.program.findUnique({ where: { id: programId }, select: { slug: true } });
  if (program) {
    revalidatePath(`/[locale]/programs/${program.slug}`, 'page');
  }
  revalidatePath('/admin/reviews');
  return { ok: true };
}

export async function deleteOwnReview(formData: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'Нужно войти' };
  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, error: 'id отсутствует' };
  const review = await prisma.review.findUnique({ where: { id }, select: { userId: true, program: { select: { slug: true } } } });
  if (!review || review.userId !== session.user.id) return { ok: false, error: 'Не ваш отзыв' };
  await prisma.review.delete({ where: { id } });
  if (review.program) {
    revalidatePath(`/[locale]/programs/${review.program.slug}`, 'page');
  }
  revalidatePath('/admin/reviews');
  return { ok: true };
}
