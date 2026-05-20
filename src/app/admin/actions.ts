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

export async function deleteCategoryAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  if (!id) throw new Error('Missing id');
  await deleteCategory(id);
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
    // priceTenge/durationDays are no longer set via the admin form —
    // tariffs cover both. Defaults from the schema apply.
    priceTenge: formData.get('priceTenge') || 0,
    durationDays: formData.get('durationDays') || 30,
    order: formData.get('order') || 0,
    isPublished: formData.get('isPublished') === 'on' || formData.get('isPublished') === 'true',
  });
  if (data.id) {
    await prisma.program.update({ where: { id: data.id }, data: { ...data, id: undefined } });
  } else {
    const created = await prisma.program.create({ data: { ...data, id: undefined } });
    // Auto-create the 3 default tariffs (Эконом / Оптима / VIP) — admin can edit prices via Тарифы page
    await createDefaultTariffsInternal(created.id);
  }
  revalidatePath('/admin/programs');
}

// Internal helper — same defaults as `createDefaultTariffs` but skips the auth check (caller is already admin-checked)
async function createDefaultTariffsInternal(programId: string) {
  const defaults = [
    { key: 'econom', nameRu: 'Эконом', nameKk: 'Эконом', durationDays: 3, priceTenge: 0, recommended: false, order: 1,
      featuresRu: ['Доступ ко всем тестам программы', 'Срок — 3 дня'],
      featuresKk: ['Барлық тесттерге қол жетімділік', 'Мерзімі — 3 күн'] },
    { key: 'optima', nameRu: 'Оптима', nameKk: 'Оптима', durationDays: 10, priceTenge: 0, recommended: true, order: 2,
      featuresRu: ['Доступ ко всем тестам', 'Подробная статистика', 'Срок — 10 дней'],
      featuresKk: ['Барлық тесттерге қол жетімділік', 'Толық статистика', 'Мерзімі — 10 күн'] },
    { key: 'vip', nameRu: 'VIP', nameKk: 'VIP', durationDays: 20, priceTenge: 0, recommended: false, order: 3,
      featuresRu: ['Всё из «Оптима»', 'Приоритетная поддержка', 'Срок — 20 дней'],
      featuresKk: ['«Оптима» бар нәрсенің барлығы', 'Басымдықты қолдау', 'Мерзімі — 20 күн'] },
  ];
  for (const t of defaults) {
    await prisma.tariff.upsert({
      where: { programId_key: { programId, key: t.key } },
      update: {},
      create: { programId, ...t },
    });
  }
}

export async function deleteProgram(id: string) {
  await requireAdmin();
  await prisma.program.delete({ where: { id } });
  revalidatePath('/admin/programs');
}

export async function reorderPrograms(categoryId: string, orderedIds: string[]) {
  await requireAdmin();
  await prisma.$transaction(
    orderedIds.map((id, idx) =>
      prisma.program.update({ where: { id }, data: { order: idx + 1 } })
    )
  );
  revalidatePath('/admin/programs');
  revalidatePath('/admin/categories');
  revalidatePath('/admin/categories/[slug]', 'page');
}

export async function setProgramPublished(id: string, isPublished: boolean) {
  await requireAdmin();
  await prisma.program.update({ where: { id }, data: { isPublished } });
  revalidatePath('/admin/programs');
  revalidatePath('/admin/categories');
  revalidatePath('/admin/categories/[slug]', 'page');
}

export async function deleteProgramAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  if (!id) throw new Error('Missing id');
  await deleteProgram(id);
}

// ---------- Modules ----------
// Modules are independent entities. Attach them to programs via ProgramModule.
const ModuleSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['LAW', 'TEST_COLLECTION']),
  isPublished: z.coerce.boolean().default(true),
  // Only used on create — attach the new module to this program automatically
  attachToProgramId: z.string().optional(),
});

export async function upsertModule(formData: FormData) {
  await requireAdmin();
  const data = ModuleSchema.parse({
    id: formData.get('id') || undefined,
    type: formData.get('type'),
    isPublished: formData.get('isPublished') === 'on' || formData.get('isPublished') === 'true',
    attachToProgramId: formData.get('attachToProgramId') || undefined,
  });
  if (data.id) {
    await prisma.module.update({
      where: { id: data.id },
      data: { type: data.type, isPublished: data.isPublished },
    });
  } else {
    const created = await prisma.module.create({
      data: { type: data.type, isPublished: data.isPublished },
    });
    if (data.attachToProgramId) {
      const max = await prisma.programModule.aggregate({
        _max: { order: true },
        where: { programId: data.attachToProgramId },
      });
      await prisma.programModule.create({
        data: {
          programId: data.attachToProgramId,
          moduleId: created.id,
          order: (max._max.order ?? 0) + 1,
        },
      });
    }
  }
  revalidatePath('/admin/modules');
  revalidatePath('/admin/programs');
}

export async function deleteModule(id: string) {
  await requireAdmin();
  await prisma.module.delete({ where: { id } });
  revalidatePath('/admin/modules');
}

export async function deleteModuleAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  if (!id) throw new Error('Missing id');
  await deleteModule(id);
}

export async function reorderModules(programId: string, orderedModuleIds: string[]) {
  await requireAdmin();
  await prisma.$transaction(
    orderedModuleIds.map((moduleId, idx) =>
      prisma.programModule.update({
        where: { programId_moduleId: { programId, moduleId } },
        data: { order: idx + 1 },
      })
    )
  );
  revalidatePath('/admin/modules');
  revalidatePath('/admin/programs');
  revalidatePath('/admin/programs/[slug]', 'page');
}

export async function attachModuleToProgram(programId: string, moduleId: string) {
  await requireAdmin();
  const max = await prisma.programModule.aggregate({
    _max: { order: true },
    where: { programId },
  });
  await prisma.programModule.create({
    data: { programId, moduleId, order: (max._max.order ?? 0) + 1 },
  });
  revalidatePath('/admin/programs');
  revalidatePath('/admin/programs/[slug]', 'page');
  revalidatePath('/admin/modules');
  revalidatePath('/admin/modules/[id]', 'page');
}

export async function detachModuleFromProgram(programId: string, moduleId: string) {
  await requireAdmin();
  await prisma.programModule.delete({
    where: { programId_moduleId: { programId, moduleId } },
  });
  revalidatePath('/admin/programs');
  revalidatePath('/admin/programs/[slug]', 'page');
  revalidatePath('/admin/modules');
  revalidatePath('/admin/modules/[id]', 'page');
}

export async function detachModuleFromProgramAction(formData: FormData) {
  const programId = String(formData.get('programId') ?? '');
  const moduleId = String(formData.get('moduleId') ?? '');
  if (!programId || !moduleId) throw new Error('Missing ids');
  await detachModuleFromProgram(programId, moduleId);
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
  mode: z.enum(['CLASSIC', 'CLASSIC_WITH_BACK', 'INSTANT_FEEDBACK', 'ALL_QUESTIONS_PAGE']).default('INSTANT_FEEDBACK'),
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

export async function deleteTestAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  if (!id) throw new Error('Missing id');
  await deleteTest(id);
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

export async function saveQuestion(payload: unknown): Promise<{ id: string }> {
  await requireAdmin();
  const data = QuestionSchema.parse(payload);
  const sanitizedText = sanitizeHtml(data.textHtml);
  const sanitizedExpl = data.explanationHtml ? sanitizeHtml(data.explanationHtml) : null;
  const answers = data.answers.map((a, i) => ({
    ...a,
    textHtml: sanitizeHtml(a.textHtml),
    order: i,
  }));

  let savedId: string;
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
          answers: { create: answers.map(({ id: _id, ...a }) => a) },
        },
      }),
    ]);
    savedId = data.id;
  } else {
    // Auto-assign order = max existing + 1 within this test
    const max = await prisma.question.aggregate({
      _max: { order: true },
      where: { testId: data.testId },
    });
    const nextOrder = (max._max.order ?? 0) + 1;
    const created = await prisma.question.create({
      data: {
        testId: data.testId,
        textHtml: sanitizedText,
        explanationHtml: sanitizedExpl,
        mediaUrl: data.mediaUrl ?? null,
        youtubeId: data.youtubeId ?? null,
        order: nextOrder,
        answers: { create: answers.map(({ id: _id, ...a }) => a) },
      },
    });
    savedId = created.id;
  }
  revalidatePath(`/admin/tests/${data.testId}/questions`);
  return { id: savedId };
}

export async function deleteQuestion(id: string, testId: string) {
  await requireAdmin();
  await prisma.question.delete({ where: { id } });
  revalidatePath(`/admin/tests/${testId}/questions`);
}

export async function deleteQuestionAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const testId = String(formData.get('testId') ?? '');
  if (!id || !testId) throw new Error('Missing id/testId');
  await deleteQuestion(id, testId);
}

// ---------- Tariffs ----------
const TariffSchema = z.object({
  id: z.string().optional(),
  programId: z.string(),
  key: z.string().min(1).max(64).regex(/^[a-z0-9_-]+$/, 'lowercase, digits, _ or -'),
  nameRu: z.string().min(1),
  nameKk: z.string().min(1),
  durationDays: z.coerce.number().int().min(1),
  priceTenge: z.coerce.number().int().min(0),
  featuresRu: z.array(z.string()).default([]),
  featuresKk: z.array(z.string()).default([]),
  recommended: z.boolean().default(false),
  order: z.coerce.number().int().default(0),
  isPublished: z.boolean().default(true),
});

export async function saveTariff(payload: unknown): Promise<{ id: string }> {
  await requireAdmin();
  const data = TariffSchema.parse(payload);
  let savedId: string;
  if (data.id) {
    await prisma.tariff.update({
      where: { id: data.id },
      data: {
        key: data.key,
        nameRu: data.nameRu,
        nameKk: data.nameKk,
        durationDays: data.durationDays,
        priceTenge: data.priceTenge,
        featuresRu: data.featuresRu,
        featuresKk: data.featuresKk,
        recommended: data.recommended,
        order: data.order,
        isPublished: data.isPublished,
      },
    });
    savedId = data.id;
  } else {
    const created = await prisma.tariff.create({
      data: {
        programId: data.programId,
        key: data.key,
        nameRu: data.nameRu,
        nameKk: data.nameKk,
        durationDays: data.durationDays,
        priceTenge: data.priceTenge,
        featuresRu: data.featuresRu,
        featuresKk: data.featuresKk,
        recommended: data.recommended,
        order: data.order,
        isPublished: data.isPublished,
      },
    });
    savedId = created.id;
  }
  revalidatePath('/admin/programs');
  return { id: savedId };
}

export async function deleteTariff(id: string) {
  await requireAdmin();
  await prisma.tariff.delete({ where: { id } });
  revalidatePath('/admin/programs');
}

export async function deleteTariffAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  if (!id) throw new Error('Missing id');
  await deleteTariff(id);
}

export async function createDefaultTariffs(programId: string) {
  await requireAdmin();
  const program = await prisma.program.findUnique({ where: { id: programId } });
  if (!program) throw new Error('Program not found');
  const round100 = (n: number) => Math.round(n / 100) * 100;
  const base = program.priceTenge;
  const defaults = [
    {
      key: 'econom',
      nameRu: 'Эконом',
      nameKk: 'Эконом',
      durationDays: 3,
      priceTenge: round100(base * 0.25),
      featuresRu: ['Доступ ко всем тестам программы', 'Базовая статистика', 'Срок — 3 дня'],
      featuresKk: ['Барлық тесттерге қол жетімділік', 'Базалық статистика', 'Мерзімі — 3 күн'],
      recommended: false,
      order: 1,
    },
    {
      key: 'optima',
      nameRu: 'Оптима',
      nameKk: 'Оптима',
      durationDays: 10,
      priceTenge: round100(base * 0.55),
      featuresRu: ['Доступ ко всем тестам', 'Подробная статистика', 'Учебные материалы', 'Срок — 10 дней'],
      featuresKk: ['Барлық тесттерге қол жетімділік', 'Толық статистика', 'Оқу материалдары', 'Мерзімі — 10 күн'],
      recommended: true,
      order: 2,
    },
    {
      key: 'vip',
      nameRu: 'VIP',
      nameKk: 'VIP',
      durationDays: 20,
      priceTenge: round100(base * 1.0),
      featuresRu: ['Всё из «Оптима»', 'Приоритетная поддержка', 'Email-уведомления', 'Срок — 20 дней'],
      featuresKk: ['«Оптима» бар нәрсенің барлығы', 'Басымдықты қолдау', 'Email хабарландырулар', 'Мерзімі — 20 күн'],
      recommended: false,
      order: 3,
    },
  ];
  for (const t of defaults) {
    await prisma.tariff.upsert({
      where: { programId_key: { programId, key: t.key } },
      update: {},
      create: { programId, ...t },
    });
  }
  revalidatePath('/admin/programs');
}

export async function reorderTariffs(programId: string, orderedIds: string[]) {
  await requireAdmin();
  await prisma.$transaction(
    orderedIds.map((id, idx) =>
      prisma.tariff.update({ where: { id }, data: { order: idx + 1 } })
    )
  );
  revalidatePath('/admin/programs');
}

// ---------- Access (manual grant) ----------
const GrantAccessSchema = z.object({
  userId: z.string().min(1),
  programId: z.string().min(1),
  tariffId: z.string().min(1),
});

export async function grantAccessManual(payload: unknown): Promise<{ accessId: string }> {
  await requireAdmin();
  const data = GrantAccessSchema.parse(payload);
  const tariff = await prisma.tariff.findUnique({ where: { id: data.tariffId } });
  if (!tariff || tariff.programId !== data.programId) {
    throw new Error('Tariff does not belong to the chosen program');
  }
  const expiresAt = new Date(Date.now() + tariff.durationDays * 24 * 60 * 60 * 1000);
  const created = await prisma.userAccess.create({
    data: {
      userId: data.userId,
      programId: data.programId,
      tariffId: tariff.id,
      expiresAt,
      source: 'MANUAL',
      paidAmountTenge: 0, // manual grants are free by default
    },
  });
  revalidatePath('/admin/access');
  return { accessId: created.id };
}

export async function extendAccessByTariff(accessId: string, tariffId: string) {
  await requireAdmin();
  const access = await prisma.userAccess.findUnique({ where: { id: accessId } });
  if (!access) throw new Error('Access not found');
  const tariff = await prisma.tariff.findUnique({ where: { id: tariffId } });
  if (!tariff || tariff.programId !== access.programId) {
    throw new Error('Tariff does not belong to the same program');
  }
  // Start from the current expiry (if still active) or now (if already expired)
  const base = access.expiresAt > new Date() ? access.expiresAt : new Date();
  const newExpires = new Date(base.getTime() + tariff.durationDays * 24 * 60 * 60 * 1000);
  await prisma.userAccess.update({
    where: { id: accessId },
    data: { expiresAt: newExpires, tariffId: tariff.id },
  });
  revalidatePath('/admin/access');
}

export async function revokeAccess(id: string) {
  await requireAdmin();
  await prisma.userAccess.delete({ where: { id } });
  revalidatePath('/admin/access');
}

export type UserInfo = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: 'USER' | 'ADMIN';
  localePref: 'RU' | 'KK';
  createdAt: Date;
  activeAccessCount: number;
  totalAccessCount: number;
  attemptCount: number;
  passedCount: number;
  totalPaidTenge: number;
  ordersCount: number;
  paidOrdersCount: number;
};

export async function getUserInfo(userId: string): Promise<UserInfo | null> {
  await requireAdmin();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      localePref: true,
      createdAt: true,
    },
  });
  if (!user) return null;

  const now = new Date();
  const [activeAccessCount, totalAccessCount, attemptCount, passedCount, paidAgg, ordersCount, paidOrdersCount] =
    await Promise.all([
      prisma.userAccess.count({ where: { userId, expiresAt: { gt: now } } }),
      prisma.userAccess.count({ where: { userId } }),
      prisma.attempt.count({ where: { userId, finishedAt: { not: null } } }),
      prisma.attempt.count({ where: { userId, passed: true } }),
      prisma.userAccess.aggregate({
        where: { userId },
        _sum: { paidAmountTenge: true },
      }),
      prisma.order.count({ where: { userId } }),
      prisma.order.count({ where: { userId, status: 'PAID' } }),
    ]);

  return {
    ...user,
    activeAccessCount,
    totalAccessCount,
    attemptCount,
    passedCount,
    totalPaidTenge: paidAgg._sum.paidAmountTenge ?? 0,
    ordersCount,
    paidOrdersCount,
  };
}

export async function revokeAccessAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  if (!id) throw new Error('Missing id');
  await revokeAccess(id);
}
