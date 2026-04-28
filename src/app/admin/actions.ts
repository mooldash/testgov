'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sanitizeHtml } from '@/lib/sanitize';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
  return session.user;
}

// ---------- Categories ----------
const CategorySchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/),
  nameRu: z.string().min(1),
  nameKk: z.string().min(1),
  descriptionRu: z.string().optional(),
  descriptionKk: z.string().optional(),
  order: z.coerce.number().int().default(0),
});

export async function upsertCategory(formData: FormData) {
  await requireAdmin();
  const data = CategorySchema.parse({
    id: formData.get('id') || undefined,
    slug: formData.get('slug'),
    nameRu: formData.get('nameRu'),
    nameKk: formData.get('nameKk'),
    descriptionRu: formData.get('descriptionRu') || undefined,
    descriptionKk: formData.get('descriptionKk') || undefined,
    order: formData.get('order') || 0,
  });
  if (data.id) {
    await prisma.category.update({ where: { id: data.id }, data: { ...data, id: undefined } });
  } else {
    await prisma.category.create({ data: { ...data, id: undefined } });
  }
  revalidatePath('/admin/categories');
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  await prisma.category.delete({ where: { id } });
  revalidatePath('/admin/categories');
}

// ---------- Programs ----------
const ProgramSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string(),
  slug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/),
  nameRu: z.string().min(1),
  nameKk: z.string().min(1),
  descriptionRu: z.string().optional(),
  descriptionKk: z.string().optional(),
  priceTenge: z.coerce.number().int().min(0).default(0),
  durationDays: z.coerce.number().int().min(1).default(30),
  order: z.coerce.number().int().default(0),
  isPublished: z.coerce.boolean().default(true),
});

export async function upsertProgram(formData: FormData) {
  await requireAdmin();
  const data = ProgramSchema.parse({
    id: formData.get('id') || undefined,
    categoryId: formData.get('categoryId'),
    slug: formData.get('slug'),
    nameRu: formData.get('nameRu'),
    nameKk: formData.get('nameKk'),
    descriptionRu: formData.get('descriptionRu') || undefined,
    descriptionKk: formData.get('descriptionKk') || undefined,
    priceTenge: formData.get('priceTenge') || 0,
    durationDays: formData.get('durationDays') || 30,
    order: formData.get('order') || 0,
    isPublished: formData.get('isPublished') === 'on' || formData.get('isPublished') === 'true',
  });
  if (data.id) {
    await prisma.program.update({ where: { id: data.id }, data: { ...data, id: undefined } });
  } else {
    await prisma.program.create({ data: { ...data, id: undefined } });
  }
  revalidatePath('/admin/programs');
}

export async function deleteProgram(id: string) {
  await requireAdmin();
  await prisma.program.delete({ where: { id } });
  revalidatePath('/admin/programs');
}

// ---------- Modules ----------
const ModuleSchema = z.object({
  id: z.string().optional(),
  programId: z.string(),
  type: z.enum(['LAW', 'TEST_COLLECTION']),
  order: z.coerce.number().int().default(0),
  isPublished: z.coerce.boolean().default(true),
});

export async function upsertModule(formData: FormData) {
  await requireAdmin();
  const data = ModuleSchema.parse({
    id: formData.get('id') || undefined,
    programId: formData.get('programId'),
    type: formData.get('type'),
    order: formData.get('order') || 0,
    isPublished: formData.get('isPublished') === 'on' || formData.get('isPublished') === 'true',
  });
  if (data.id) {
    await prisma.module.update({ where: { id: data.id }, data: { ...data, id: undefined } });
  } else {
    await prisma.module.create({ data: { ...data, id: undefined } });
  }
  revalidatePath('/admin/modules');
  revalidatePath('/admin/programs');
}

export async function deleteModule(id: string) {
  await requireAdmin();
  await prisma.module.delete({ where: { id } });
  revalidatePath('/admin/modules');
}

// ---------- ModuleContent (LAW body per locale) ----------
const ContentSchema = z.object({
  moduleId: z.string(),
  locale: z.enum(['KK', 'RU']),
  title: z.string().min(1),
  bodyHtml: z.string().default(''),
});

export async function upsertModuleContent(formData: FormData) {
  await requireAdmin();
  const data = ContentSchema.parse({
    moduleId: formData.get('moduleId'),
    locale: formData.get('locale'),
    title: formData.get('title'),
    bodyHtml: formData.get('bodyHtml') ?? '',
  });
  const sanitized = sanitizeHtml(data.bodyHtml);
  await prisma.moduleContent.upsert({
    where: { moduleId_locale: { moduleId: data.moduleId, locale: data.locale } },
    create: { ...data, bodyHtml: sanitized },
    update: { title: data.title, bodyHtml: sanitized },
  });
  revalidatePath(`/admin/modules/${data.moduleId}`);
}

// ---------- Test ----------
const TestSchema = z.object({
  id: z.string().optional(),
  moduleId: z.string(),
  locale: z.enum(['KK', 'RU']),
  title: z.string().min(1),
  shuffleQuestions: z.coerce.boolean().default(false),
  shuffleAnswers: z.coerce.boolean().default(false),
  timeLimitSec: z.preprocess((v) => (v === '' || v == null ? null : Number(v)), z.number().int().nullable()),
  maxAttempts: z.preprocess((v) => (v === '' || v == null ? null : Number(v)), z.number().int().nullable()),
  requireAuth: z.coerce.boolean().default(true),
  requireAnswer: z.coerce.boolean().default(false),
  showScoreDuring: z.coerce.boolean().default(false),
  showCorrectAnswers: z.coerce.boolean().default(true),
  mode: z.enum(['CLASSIC', 'CLASSIC_WITH_BACK', 'INSTANT_FEEDBACK', 'ALL_QUESTIONS_PAGE']),
  emailNotifications: z.coerce.boolean().default(false),
  passingScore: z.coerce.number().int().min(0).max(100).default(70),
  questionLimit: z.preprocess((v) => (v === '' || v == null ? null : Number(v)), z.number().int().nullable()),
  isPublished: z.coerce.boolean().default(true),
});

export async function upsertTest(formData: FormData) {
  await requireAdmin();
  const raw = Object.fromEntries(formData.entries());
  const bools = [
    'shuffleQuestions',
    'shuffleAnswers',
    'requireAuth',
    'requireAnswer',
    'showScoreDuring',
    'showCorrectAnswers',
    'emailNotifications',
    'isPublished',
  ];
  for (const b of bools) raw[b] = formData.get(b) === 'on' ? 'true' : 'false';
  const data = TestSchema.parse(raw);
  if (data.id) {
    await prisma.test.update({ where: { id: data.id }, data: { ...data, id: undefined } });
  } else {
    await prisma.test.create({ data: { ...data, id: undefined } });
  }
  revalidatePath('/admin/tests');
}

export async function deleteTest(id: string) {
  await requireAdmin();
  await prisma.test.delete({ where: { id } });
  revalidatePath('/admin/tests');
}

// ---------- Question / Answer ----------
const QuestionSchema = z.object({
  id: z.string().optional(),
  testId: z.string(),
  textHtml: z.string().min(1),
  explanationHtml: z.string().optional(),
  mediaUrl: z.string().nullable().optional(),
  youtubeId: z.string().nullable().optional(),
  order: z.coerce.number().int().default(0),
  answers: z
    .array(
      z.object({
        id: z.string().optional(),
        textHtml: z.string().min(1),
        isCorrect: z.boolean(),
        order: z.number().int().default(0),
      })
    )
    .min(2),
});

export async function saveQuestion(payload: unknown) {
  await requireAdmin();
  const data = QuestionSchema.parse(payload);
  const sanitizedText = sanitizeHtml(data.textHtml);
  const sanitizedExpl = data.explanationHtml ? sanitizeHtml(data.explanationHtml) : null;
  const answers = data.answers.map((a, i) => ({
    ...a,
    textHtml: sanitizeHtml(a.textHtml),
    order: i,
  }));

  if (data.id) {
    await prisma.$transaction([
      prisma.answer.deleteMany({ where: { questionId: data.id } }),
      prisma.question.update({
        where: { id: data.id },
        data: {
          textHtml: sanitizedText,
          explanationHtml: sanitizedExpl,
          mediaUrl: data.mediaUrl ?? null,
          youtubeId: data.youtubeId ?? null,
          order: data.order,
          answers: { create: answers.map(({ id: _id, ...a }) => a) },
        },
      }),
    ]);
  } else {
    await prisma.question.create({
      data: {
        testId: data.testId,
        textHtml: sanitizedText,
        explanationHtml: sanitizedExpl,
        mediaUrl: data.mediaUrl ?? null,
        youtubeId: data.youtubeId ?? null,
        order: data.order,
        answers: { create: answers.map(({ id: _id, ...a }) => a) },
      },
    });
  }
  revalidatePath(`/admin/tests/${data.testId}/questions`);
}

export async function deleteQuestion(id: string, testId: string) {
  await requireAdmin();
  await prisma.question.delete({ where: { id } });
  revalidatePath(`/admin/tests/${testId}/questions`);
}

// ---------- Access (manual grant) ----------
const AccessSchema = z.object({
  email: z.string().email(),
  programId: z.string(),
  durationDays: z.coerce.number().int().min(1).default(30),
});

export async function grantAccess(formData: FormData) {
  await requireAdmin();
  const data = AccessSchema.parse({
    email: formData.get('email'),
    programId: formData.get('programId'),
    durationDays: formData.get('durationDays') || 30,
  });
  const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase().trim() } });
  if (!user) throw new Error('User not found');
  const expiresAt = new Date(Date.now() + data.durationDays * 24 * 60 * 60 * 1000);
  await prisma.userAccess.create({
    data: { userId: user.id, programId: data.programId, expiresAt, source: 'MANUAL' },
  });
  revalidatePath('/admin/access');
}

export async function revokeAccess(id: string) {
  await requireAdmin();
  await prisma.userAccess.delete({ where: { id } });
  revalidatePath('/admin/access');
}
