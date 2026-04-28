import { PrismaClient, Locale, ModuleType, TestMode, AccessSource } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@testgov.kz';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'changeme';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN' },
    create: {
      email: adminEmail,
      passwordHash,
      name: 'Administrator',
      role: 'ADMIN',
      localePref: 'RU',
    },
  });

  const demoUserEmail = 'user@testgov.kz';
  await prisma.user.upsert({
    where: { email: demoUserEmail },
    update: {},
    create: {
      email: demoUserEmail,
      passwordHash: await bcrypt.hash('user1234', 10),
      name: 'Demo User',
      role: 'USER',
      localePref: 'RU',
    },
  });

  const categoriesData = [
    {
      slug: 'administrative',
      nameRu: 'Административная государственная служба',
      nameKk: 'Әкімшілік мемлекеттік қызмет',
      descriptionRu: 'Тестирование для административных государственных служащих.',
      descriptionKk: 'Әкімшілік мемлекеттік қызметкерлерге арналған тестілеу.',
      order: 1,
    },
    {
      slug: 'law-enforcement',
      nameRu: 'Правоохранительная служба',
      nameKk: 'Құқық қорғау қызметі',
      descriptionRu: 'Тестирование для правоохранительных органов.',
      descriptionKk: 'Құқық қорғау органдарына арналған тестілеу.',
      order: 2,
    },
    {
      slug: 'numerical',
      nameRu: 'Числовые тесты',
      nameKk: 'Сандық тестілер',
      descriptionRu: 'Тренировка числовой логики.',
      descriptionKk: 'Сандық логиканы жаттықтыру.',
      order: 3,
    },
    {
      slug: 'personal-qualities',
      nameRu: 'Личные качества',
      nameKk: 'Жеке қасиеттер',
      descriptionRu: 'Оценка личных качеств кандидатов.',
      descriptionKk: 'Үміткерлердің жеке қасиеттерін бағалау.',
      order: 4,
    },
  ];

  const categories: Record<string, string> = {};
  for (const c of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: c.slug },
      update: c,
      create: c,
    });
    categories[c.slug] = created.id;
  }

  // Administrative: 1 program
  const admProgram = await prisma.program.upsert({
    where: { slug: 'administrative-base' },
    update: {},
    create: {
      categoryId: categories['administrative'],
      slug: 'administrative-base',
      nameRu: 'Базовая программа АГС',
      nameKk: 'ӘМҚ базалық бағдарламасы',
      descriptionRu: 'Полный курс подготовки к тестированию на административную государственную службу.',
      descriptionKk: 'Әкімшілік мемлекеттік қызметке тестілеуге толық дайындық курсы.',
      priceTenge: 9900,
      durationDays: 30,
      order: 1,
    },
  });

  // Law Enforcement: 3 programs
  const lawPrograms = await Promise.all([
    prisma.program.upsert({
      where: { slug: 'le-police' },
      update: {},
      create: {
        categoryId: categories['law-enforcement'],
        slug: 'le-police',
        nameRu: 'МВД — общая подготовка',
        nameKk: 'ІІМ — жалпы дайындық',
        priceTenge: 12900,
        durationDays: 30,
        order: 1,
      },
    }),
    prisma.program.upsert({
      where: { slug: 'le-anticorruption' },
      update: {},
      create: {
        categoryId: categories['law-enforcement'],
        slug: 'le-anticorruption',
        nameRu: 'Антикоррупционная служба',
        nameKk: 'Сыбайлас жемқорлыққа қарсы қызмет',
        priceTenge: 14900,
        durationDays: 30,
        order: 2,
      },
    }),
    prisma.program.upsert({
      where: { slug: 'le-finance-monitoring' },
      update: {},
      create: {
        categoryId: categories['law-enforcement'],
        slug: 'le-finance-monitoring',
        nameRu: 'Финансовый мониторинг',
        nameKk: 'Қаржылық мониторинг',
        priceTenge: 14900,
        durationDays: 30,
        order: 3,
      },
    }),
  ]);

  await prisma.program.upsert({
    where: { slug: 'numerical-base' },
    update: {},
    create: {
      categoryId: categories['numerical'],
      slug: 'numerical-base',
      nameRu: 'Числовые тесты — тренировка',
      nameKk: 'Сандық тестілер — жаттығу',
      priceTenge: 4900,
      durationDays: 90,
      order: 1,
    },
  });

  await prisma.program.upsert({
    where: { slug: 'personal-qualities-base' },
    update: {},
    create: {
      categoryId: categories['personal-qualities'],
      slug: 'personal-qualities-base',
      nameRu: 'Личные качества — диагностика',
      nameKk: 'Жеке қасиеттер — диагностика',
      priceTenge: 4900,
      durationDays: 90,
      order: 1,
    },
  });

  // Skip module/test creation if already seeded for this program
  const existingModules = await prisma.module.count({ where: { programId: admProgram.id } });
  if (existingModules > 0) {
    console.log('✅ Seed complete (modules already present, skipped content seed).');
    console.log(`   Admin: ${adminEmail} / ${adminPassword}`);
    console.log(`   Demo:  ${demoUserEmail} / user1234`);
    return;
  }

  // Modules under admProgram
  const lawModule = await prisma.module.create({
    data: {
      programId: admProgram.id,
      type: ModuleType.LAW,
      order: 1,
      contents: {
        create: [
          {
            locale: Locale.RU,
            title: 'Закон «О государственной службе РК»',
            bodyHtml:
              '<h2>Глава 1. Общие положения</h2><p>Настоящий закон регулирует общественные отношения, возникающие в сфере государственной службы Республики Казахстан.</p><p><strong>Государственная служба</strong> — деятельность государственных служащих в государственных органах по исполнению должностных полномочий.</p>',
          },
          {
            locale: Locale.KK,
            title: '«ҚР Мемлекеттік қызмет туралы» Заңы',
            bodyHtml:
              '<h2>1-тарау. Жалпы ережелер</h2><p>Осы Заң Қазақстан Республикасының мемлекеттік қызмет саласында туындайтын қоғамдық қатынастарды реттейді.</p><p><strong>Мемлекеттік қызмет</strong> — мемлекеттік қызметшілердің мемлекеттік органдардағы лауазымдық өкілеттіктерін атқару жөніндегі қызметі.</p>',
          },
        ],
      },
    },
    include: { contents: true },
  });

  const testModule = await prisma.module.create({
    data: {
      programId: admProgram.id,
      type: ModuleType.TEST_COLLECTION,
      order: 2,
    },
  });

  // Tests per language with DIFFERENT questions
  await prisma.test.create({
    data: {
      moduleId: testModule.id,
      locale: Locale.RU,
      title: 'Базовый тест по госслужбе (РУ) — Классический режим',
      mode: TestMode.CLASSIC,
      shuffleQuestions: true,
      shuffleAnswers: true,
      timeLimitSec: 600,
      maxAttempts: 3,
      passingScore: 60,
      showCorrectAnswers: true,
      questions: {
        create: [
          {
            order: 1,
            textHtml: '<p>Кто является главой государства в Республике Казахстан?</p>',
            explanationHtml: '<p>Согласно Конституции РК, Президент является главой государства.</p>',
            answers: {
              create: [
                { textHtml: 'Премьер-министр', isCorrect: false, order: 1 },
                { textHtml: 'Президент', isCorrect: true, order: 2 },
                { textHtml: 'Председатель Сената', isCorrect: false, order: 3 },
                { textHtml: 'Председатель Мажилиса', isCorrect: false, order: 4 },
              ],
            },
          },
          {
            order: 2,
            textHtml: '<p>Какова официальная валюта Республики Казахстан?</p>',
            answers: {
              create: [
                { textHtml: 'Тенге', isCorrect: true, order: 1 },
                { textHtml: 'Рубль', isCorrect: false, order: 2 },
                { textHtml: 'Сум', isCorrect: false, order: 3 },
                { textHtml: 'Манат', isCorrect: false, order: 4 },
              ],
            },
          },
          {
            order: 3,
            textHtml: '<p>Сколько палат имеет Парламент Республики Казахстан?</p>',
            answers: {
              create: [
                { textHtml: 'Одну', isCorrect: false, order: 1 },
                { textHtml: 'Две: Сенат и Мажилис', isCorrect: true, order: 2 },
                { textHtml: 'Три', isCorrect: false, order: 3 },
                { textHtml: 'Четыре', isCorrect: false, order: 4 },
              ],
            },
          },
          {
            order: 4,
            textHtml: '<p>Государственным языком Республики Казахстан является:</p>',
            answers: {
              create: [
                { textHtml: 'Русский', isCorrect: false, order: 1 },
                { textHtml: 'Казахский', isCorrect: true, order: 2 },
                { textHtml: 'Английский', isCorrect: false, order: 3 },
              ],
            },
          },
          {
            order: 5,
            textHtml: '<p>Столица Республики Казахстан — это:</p>',
            answers: {
              create: [
                { textHtml: 'Алматы', isCorrect: false, order: 1 },
                { textHtml: 'Шымкент', isCorrect: false, order: 2 },
                { textHtml: 'Астана', isCorrect: true, order: 3 },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.test.create({
    data: {
      moduleId: testModule.id,
      locale: Locale.KK,
      title: 'Мемлекеттік қызмет бойынша базалық тест (ҚАЗ) — Классикалық режим',
      mode: TestMode.CLASSIC,
      shuffleQuestions: true,
      shuffleAnswers: true,
      timeLimitSec: 600,
      maxAttempts: 3,
      passingScore: 60,
      showCorrectAnswers: true,
      questions: {
        create: [
          {
            order: 1,
            textHtml: '<p>Қазақстан Республикасының Конституциясы қашан қабылданды?</p>',
            answers: {
              create: [
                { textHtml: '1991 жыл', isCorrect: false, order: 1 },
                { textHtml: '1995 жыл', isCorrect: true, order: 2 },
                { textHtml: '1993 жыл', isCorrect: false, order: 3 },
                { textHtml: '1997 жыл', isCorrect: false, order: 4 },
              ],
            },
          },
          {
            order: 2,
            textHtml: '<p>Қазақстан Республикасының мемлекеттік туының түсі қандай?</p>',
            answers: {
              create: [
                { textHtml: 'Көк', isCorrect: true, order: 1 },
                { textHtml: 'Жасыл', isCorrect: false, order: 2 },
                { textHtml: 'Қызыл', isCorrect: false, order: 3 },
              ],
            },
          },
          {
            order: 3,
            textHtml: '<p>Қазақстан Республикасының Үкіметін кім құрайды?</p>',
            answers: {
              create: [
                { textHtml: 'Парламент', isCorrect: false, order: 1 },
                { textHtml: 'Президент', isCorrect: true, order: 2 },
                { textHtml: 'Конституциялық кеңес', isCorrect: false, order: 3 },
              ],
            },
          },
          {
            order: 4,
            textHtml: '<p>Қазақстан қай жылы тәуелсіздік алды?</p>',
            answers: {
              create: [
                { textHtml: '1990', isCorrect: false, order: 1 },
                { textHtml: '1991', isCorrect: true, order: 2 },
                { textHtml: '1992', isCorrect: false, order: 3 },
              ],
            },
          },
        ],
      },
    },
  });

  // A second test module with INSTANT_FEEDBACK so user can sample mode 3
  const practiceModule = await prisma.module.create({
    data: {
      programId: admProgram.id,
      type: ModuleType.TEST_COLLECTION,
      order: 3,
    },
  });

  await prisma.test.create({
    data: {
      moduleId: practiceModule.id,
      locale: Locale.RU,
      title: 'Тренировка с мгновенной обратной связью (РУ)',
      mode: TestMode.INSTANT_FEEDBACK,
      showCorrectAnswers: true,
      showScoreDuring: true,
      passingScore: 50,
      questions: {
        create: [
          {
            order: 1,
            textHtml: '<p>Сколько областей в Казахстане (по состоянию на 2024 год)?</p>',
            explanationHtml: '<p>В Казахстане 17 областей и 3 города республиканского значения.</p>',
            answers: {
              create: [
                { textHtml: '14', isCorrect: false, order: 1 },
                { textHtml: '17', isCorrect: true, order: 2 },
                { textHtml: '20', isCorrect: false, order: 3 },
              ],
            },
          },
          {
            order: 2,
            textHtml: '<p>Высший представительный орган РК — это:</p>',
            answers: {
              create: [
                { textHtml: 'Правительство', isCorrect: false, order: 1 },
                { textHtml: 'Парламент', isCorrect: true, order: 2 },
                { textHtml: 'Верховный Суд', isCorrect: false, order: 3 },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.test.create({
    data: {
      moduleId: practiceModule.id,
      locale: Locale.KK,
      title: 'Жедел кері байланысы бар жаттығу (ҚАЗ)',
      mode: TestMode.INSTANT_FEEDBACK,
      showCorrectAnswers: true,
      showScoreDuring: true,
      passingScore: 50,
      questions: {
        create: [
          {
            order: 1,
            textHtml: '<p>Қазақстан Республикасының тұңғыз президенті кім?</p>',
            answers: {
              create: [
                { textHtml: 'Қ.К. Тоқаев', isCorrect: false, order: 1 },
                { textHtml: 'Н.Ә. Назарбаев', isCorrect: true, order: 2 },
                { textHtml: 'Д.А. Қонаев', isCorrect: false, order: 3 },
              ],
            },
          },
        ],
      },
    },
  });

  // Grant the demo user access to admProgram for 30 days
  const demoUser = await prisma.user.findUnique({ where: { email: demoUserEmail } });
  if (demoUser) {
    const existing = await prisma.userAccess.findFirst({
      where: { userId: demoUser.id, programId: admProgram.id },
    });
    if (!existing) {
      await prisma.userAccess.create({
        data: {
          userId: demoUser.id,
          programId: admProgram.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          source: AccessSource.TRIAL,
        },
      });
    }
  }

  console.log('✅ Seed complete.');
  console.log(`   Admin: ${adminEmail} / ${adminPassword}`);
  console.log(`   Demo:  ${demoUserEmail} / user1234`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
