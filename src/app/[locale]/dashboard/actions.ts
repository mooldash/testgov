'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type ActionState = { ok: boolean; message: string } | null;

const ProfileSchema = z.object({
  name: z.string().trim().min(1, 'Имя не может быть пустым').max(100),
  email: z.string().trim().toLowerCase().email('Неверный формат email'),
});

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { ok: false, message: 'Не авторизован' };

  const parsed = ProfileSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Ошибка валидации' };
  }
  const { name, email } = parsed.data;

  if (email !== session.user.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== session.user.id) {
      return { ok: false, message: 'Этот email уже занят' };
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name, email },
  });

  revalidatePath('/[locale]/dashboard', 'page');
  return {
    ok: true,
    message:
      email !== session.user.email
        ? 'Профиль сохранён. Перелогиньтесь, чтобы обновить сессию.'
        : 'Профиль сохранён',
  };
}

const PasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Введите текущий пароль'),
    newPassword: z.string().min(6, 'Новый пароль должен быть не короче 6 символов'),
    confirmPassword: z.string().min(1, 'Подтвердите новый пароль'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { ok: false, message: 'Не авторизован' };

  const parsed = PasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Ошибка валидации' };
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { ok: false, message: 'Пользователь не найден' };

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!ok) return { ok: false, message: 'Текущий пароль неверен' };

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return { ok: true, message: 'Пароль обновлён' };
}
