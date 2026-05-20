import { PrismaClient, Locale, ModuleType, TestMode, AccessSource } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@testgov.kz';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'changeme';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN', phone: '+7 700 000 00 01' },
    create: {
      email: adminEmail,
      passwordHash,
      name: 'Administrator',
      role: 'ADMIN',
      phone: '+7 700 000 00 01',
      localePref: 'RU',
    },
  });

  const demoUserEmail = 'user@testgov.kz';
  await prisma.user.upsert({
    where: { email: demoUserEmail },
    update: { phone: '+7 700 000 00 02' },
    create: {
      email: demoUserEmail,
      passwordHash: await bcrypt.hash('user1234', 10),
      name: 'Demo User',
      phone: '+7 700 000 00 02',
      role: 'USER',
      localePref: 'RU',
    },
  });

  // ── CATEGORIES ──
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

  // ── PROGRAMS ──
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

  await Promise.all([
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
    prisma.program.upsert({
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
    }),
    prisma.program.upsert({
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
    }),
  ]);

  // ── MODULES (independent of programs; attached via ProgramModule) ──
  // Skip if any module already exists (idempotent)
  const moduleCount = await prisma.module.count();
  if (moduleCount === 0) {
    // 1. LAW module: "Закон о госслужбе РК"
    const lawModule = await prisma.module.create({
      data: {
        type: ModuleType.LAW,
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
                '<h2>1-тарау. Жалпы ережелер</h2><p>Осы Заң Қазақстан Республикасының мемлекеттік қызмет саласында туындайтын қоғамдық қатынастарды реттейді.</p>',
            },
          ],
        },
      },
    });
    await prisma.programModule.create({
      data: { programId: admProgram.id, moduleId: lawModule.id, order: 1 },
    });

    // 2. Demo CLASSIC test module
    const classicModule = await prisma.module.create({
      data: { type: ModuleType.TEST_COLLECTION },
    });
    await prisma.programModule.create({
      data: { programId: admProgram.id, moduleId: classicModule.id, order: 2 },
    });
    await prisma.test.create({
      data: {
        moduleId: classicModule.id,
        locale: Locale.RU,
        title: 'Базовый тест по госслужбе — Классический режим',
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
                ],
              },
            },
            {
              order: 3,
              textHtml: '<p>Государственным языком Республики Казахстан является:</p>',
              answers: {
                create: [
                  { textHtml: 'Русский', isCorrect: false, order: 1 },
                  { textHtml: 'Казахский', isCorrect: true, order: 2 },
                  { textHtml: 'Английский', isCorrect: false, order: 3 },
                ],
              },
            },
          ],
        },
      },
    });
    await prisma.test.create({
      data: {
        moduleId: classicModule.id,
        locale: Locale.KK,
        title: 'Мемлекеттік қызмет бойынша базалық тест — Классикалық режим',
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
                ],
              },
            },
          ],
        },
      },
    });

    // 3. Nine law-topic INSTANT_FEEDBACK modules
    const lawTopics: Array<{ order: number; titleRu: string; titleKk: string }> = [
      { order: 11, titleRu: 'Конституция Республики Казахстан', titleKk: 'Қазақстан Республикасының Конституциясы' },
      { order: 12, titleRu: 'Закон «О государственной службе РК»', titleKk: '«ҚР Мемлекеттік қызметі туралы» Заң' },
      { order: 13, titleRu: 'Закон «О правоохранительной службе РК»', titleKk: '«ҚР Құқық қорғау қызметі туралы» Заң' },
      { order: 14, titleRu: 'Закон «О противодействии коррупции»', titleKk: '«Сыбайлас жемқорлыққа қарсы іс-қимыл туралы» Заң' },
      { order: 15, titleRu: 'Административно-процессуальный кодекс РК', titleKk: 'ҚР Әкімшілік рәсімдік-процестік кодексі' },
      { order: 16, titleRu: 'Кодекс об административных правонарушениях РК', titleKk: 'Әкімшілік құқық бұзушылық туралы кодекс' },
      { order: 17, titleRu: 'Уголовный кодекс РК', titleKk: 'ҚР Қылмыстық кодексі' },
      { order: 18, titleRu: 'Уголовно-процессуальный кодекс РК', titleKk: 'ҚР Қылмыстық іс жүргізу кодексі' },
      { order: 19, titleRu: 'Этический кодекс государственных служащих РК', titleKk: 'Мемлекеттік қызметшілердің Әдеп кодексі' },
    ];

    const placeholderQ = (topicTitle: string) =>
      [1, 2, 3].map((n) => ({
        order: n,
        textHtml: `<p>Заглушка: вопрос ${n} по теме «${topicTitle}». Замените содержание через админку.</p>`,
        answers: {
          create: [
            { textHtml: 'Правильный ответ (вариант A)', isCorrect: true, order: 1 },
            { textHtml: 'Неправильный ответ B', isCorrect: false, order: 2 },
            { textHtml: 'Неправильный ответ C', isCorrect: false, order: 3 },
            { textHtml: 'Неправильный ответ D', isCorrect: false, order: 4 },
          ],
        },
      }));

    const placeholderQKk = (topicTitle: string) =>
      [1, 2, 3].map((n) => ({
        order: n,
        textHtml: `<p>Жаймасы: «${topicTitle}» тақырыбы бойынша ${n}-сұрақ. Мазмұнды әкімшіде алмастырыңыз.</p>`,
        answers: {
          create: [
            { textHtml: 'Дұрыс жауап (A нұсқа)', isCorrect: true, order: 1 },
            { textHtml: 'Дұрыс емес жауап B', isCorrect: false, order: 2 },
            { textHtml: 'Дұрыс емес жауап C', isCorrect: false, order: 3 },
            { textHtml: 'Дұрыс емес жауап D', isCorrect: false, order: 4 },
          ],
        },
      }));

    for (const topic of lawTopics) {
      const mod = await prisma.module.create({
        data: { type: ModuleType.TEST_COLLECTION },
      });
      await prisma.programModule.create({
        data: { programId: admProgram.id, moduleId: mod.id, order: topic.order },
      });

      await prisma.test.create({
        data: {
          moduleId: mod.id,
          locale: Locale.RU,
          title: topic.titleRu,
          mode: TestMode.INSTANT_FEEDBACK,
          showCorrectAnswers: true,
          showScoreDuring: true,
          passingScore: 70,
          questions: { create: placeholderQ(topic.titleRu) },
        },
      });
      await prisma.test.create({
        data: {
          moduleId: mod.id,
          locale: Locale.KK,
          title: topic.titleKk,
          mode: TestMode.INSTANT_FEEDBACK,
          showCorrectAnswers: true,
          showScoreDuring: true,
          passingScore: 70,
          questions: { create: placeholderQKk(topic.titleKk) },
        },
      });
    }
  }

  // ── TARIFFS (default 3 per program if missing) ──
  const round100 = (n: number) => Math.round(n / 100) * 100;
  const DEFAULT_TARIFFS = [
    {
      key: 'econom',
      nameRu: 'Эконом',
      nameKk: 'Эконом',
      durationDays: 3,
      multiplier: 0.25,
      recommended: false,
      featuresRu: [
        'Доступ ко всем тестам программы',
        'Базовая статистика прохождений',
        'Срок действия — 3 дня',
      ],
      featuresKk: [
        'Бағдарламаның барлық тесттеріне қол жетімділік',
        'Базалық статистика',
        'Қолданылу мерзімі — 3 күн',
      ],
      order: 1,
    },
    {
      key: 'optima',
      nameRu: 'Оптима',
      nameKk: 'Оптима',
      durationDays: 10,
      multiplier: 0.55,
      recommended: true,
      featuresRu: [
        'Доступ ко всем тестам программы',
        'Подробная статистика и анализ ошибок',
        'Учебные материалы и разборы',
        'Срок действия — 10 дней',
      ],
      featuresKk: [
        'Бағдарламаның барлық тесттеріне қол жетімділік',
        'Толық статистика мен қателерді талдау',
        'Оқу материалдары мен талдаулар',
        'Қолданылу мерзімі — 10 күн',
      ],
      order: 2,
    },
    {
      key: 'vip',
      nameRu: 'VIP',
      nameKk: 'VIP',
      durationDays: 20,
      multiplier: 1.0,
      recommended: false,
      featuresRu: [
        'Всё из тарифа «Оптима»',
        'Приоритетная поддержка',
        'Email-уведомления о новых тестах',
        'Расширенная аналитика прогресса',
        'Срок действия — 20 дней',
      ],
      featuresKk: [
        '«Оптима» тарифінде бар нәрсенің барлығы',
        'Басымдықты қолдау',
        'Жаңа тесттер туралы email хабарландырулар',
        'Кеңейтілген прогресс аналитикасы',
        'Қолданылу мерзімі — 20 күн',
      ],
      order: 3,
    },
  ];

  const allPrograms = await prisma.program.findMany({ select: { id: true, priceTenge: true } });
  for (const p of allPrograms) {
    const existing = await prisma.tariff.count({ where: { programId: p.id } });
    if (existing > 0) continue;
    for (const t of DEFAULT_TARIFFS) {
      await prisma.tariff.create({
        data: {
          programId: p.id,
          key: t.key,
          nameRu: t.nameRu,
          nameKk: t.nameKk,
          durationDays: t.durationDays,
          priceTenge: round100(p.priceTenge * t.multiplier),
          featuresRu: t.featuresRu,
          featuresKk: t.featuresKk,
          recommended: t.recommended,
          order: t.order,
        },
      });
    }
  }

  // ── DEMO ACCESS ──
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
          source: AccessSource.MANUAL,
        },
      });
    }
  }

  // ── 10 DEMO USERS WITH REALISTIC ACCESSES ──
  const demoPersonas: Array<{ email: string; name: string; phone: string }> = [
    { email: 'ainur.abilova@mail.kz', name: 'Айнур Абилова', phone: '+7 701 234 56 78' },
    { email: 'aslan.bekov@mail.kz', name: 'Аслан Беков', phone: '+7 702 345 67 89' },
    { email: 'dana.kim@mail.kz', name: 'Дана Ким', phone: '+7 705 456 78 90' },
    { email: 'nurlan.sadykov@mail.kz', name: 'Нурлан Садыков', phone: '+7 707 567 89 01' },
    { email: 'aigul.muratova@mail.kz', name: 'Айгуль Муратова', phone: '+7 708 678 90 12' },
    { email: 'ruslan.tursunov@mail.kz', name: 'Руслан Турсунов', phone: '+7 747 789 01 23' },
    { email: 'madina.aitkalieva@mail.kz', name: 'Мадина Айткалиева', phone: '+7 776 890 12 34' },
    { email: 'timur.zhakupov@mail.kz', name: 'Тимур Жакупов', phone: '+7 778 901 23 45' },
    { email: 'saule.omarova@mail.kz', name: 'Сауле Омарова', phone: '+7 771 012 34 56' },
    { email: 'erlan.kasymov@mail.kz', name: 'Ерлан Касымов', phone: '+7 775 123 45 67' },
  ];

  const sharedPasswordHash = await bcrypt.hash('demo1234', 10);

  // Pull all programs + their published tariffs for assignment
  const allProgramsWithTariffs = await prisma.program.findMany({
    include: { tariffs: { where: { isPublished: true }, orderBy: { order: 'asc' } } },
    orderBy: { order: 'asc' },
  });

  // Deterministic but varied assignment: each persona gets one or two accesses
  // covering different programs, tariffs, sources and statuses.
  type DemoAssignment = {
    programIdx: number;
    tariffIdx: number;
    source: 'PURCHASE' | 'MANUAL';
    /** offset in days from now for expiresAt — positive = future, negative = expired */
    expiresInDays: number;
    /** how many days ago the access was granted (createdAt) */
    grantedDaysAgo: number;
  };

  const assignments: DemoAssignment[][] = [
    // 1. Ainur — paid VIP АГС, fresh
    [{ programIdx: 0, tariffIdx: 2, source: 'PURCHASE', expiresInDays: 18, grantedDaysAgo: 2 }],
    // 2. Aslan — paid Оптима МВД, mid-term
    [{ programIdx: 1, tariffIdx: 1, source: 'PURCHASE', expiresInDays: 7, grantedDaysAgo: 3 }],
    // 3. Dana — Эконом Антикоррупция + расширенный VIP АГС
    [
      { programIdx: 2, tariffIdx: 0, source: 'PURCHASE', expiresInDays: 1, grantedDaysAgo: 2 },
      { programIdx: 0, tariffIdx: 2, source: 'PURCHASE', expiresInDays: 19, grantedDaysAgo: 1 },
    ],
    // 4. Nurlan — manual VIP АГС (free admin grant)
    [{ programIdx: 0, tariffIdx: 2, source: 'MANUAL', expiresInDays: 20, grantedDaysAgo: 0 }],
    // 5. Aigul — manual Числовые тесты + paid Оптима АГС
    [
      { programIdx: 4, tariffIdx: 1, source: 'MANUAL', expiresInDays: 10, grantedDaysAgo: 0 },
      { programIdx: 0, tariffIdx: 1, source: 'PURCHASE', expiresInDays: 9, grantedDaysAgo: 1 },
    ],
    // 6. Ruslan — paid Эконом Финмониторинг, expiring tomorrow
    [{ programIdx: 3, tariffIdx: 0, source: 'PURCHASE', expiresInDays: 1, grantedDaysAgo: 2 }],
    // 7. Madina — expired VIP Личные качества (renewal candidate)
    [{ programIdx: 5, tariffIdx: 2, source: 'PURCHASE', expiresInDays: -5, grantedDaysAgo: 25 }],
    // 8. Timur — paid Оптима Антикоррупция
    [{ programIdx: 2, tariffIdx: 1, source: 'PURCHASE', expiresInDays: 6, grantedDaysAgo: 4 }],
    // 9. Saule — manual Личные качества (3 days)
    [{ programIdx: 5, tariffIdx: 0, source: 'MANUAL', expiresInDays: 3, grantedDaysAgo: 0 }],
    // 10. Erlan — paid VIP Финмониторинг, long-term
    [{ programIdx: 3, tariffIdx: 2, source: 'PURCHASE', expiresInDays: 17, grantedDaysAgo: 3 }],
  ];

  for (let i = 0; i < demoPersonas.length; i++) {
    const persona = demoPersonas[i];
    const user = await prisma.user.upsert({
      where: { email: persona.email },
      update: { name: persona.name, phone: persona.phone },
      create: {
        email: persona.email,
        passwordHash: sharedPasswordHash,
        name: persona.name,
        phone: persona.phone,
        role: 'USER',
        localePref: 'RU',
      },
    });

    const existing = await prisma.userAccess.count({ where: { userId: user.id } });
    if (existing > 0) continue;

    for (const a of assignments[i]) {
      const program = allProgramsWithTariffs[a.programIdx];
      if (!program) continue;
      const tariff = program.tariffs[a.tariffIdx];
      if (!tariff) continue;

      const grantedAt = new Date(Date.now() - a.grantedDaysAgo * 24 * 60 * 60 * 1000);
      const expiresAt = new Date(Date.now() + a.expiresInDays * 24 * 60 * 60 * 1000);

      await prisma.userAccess.create({
        data: {
          userId: user.id,
          programId: program.id,
          tariffId: tariff.id,
          expiresAt,
          source: AccessSource[a.source],
          paidAmountTenge: a.source === 'PURCHASE' ? tariff.priceTenge : 0,
          createdAt: grantedAt,
        },
      });

      // For PURCHASE — also create a PAID order so the user's dashboard shows
      // a coherent purchase history
      if (a.source === 'PURCHASE') {
        await prisma.order.create({
          data: {
            userId: user.id,
            programId: program.id,
            amountTenge: tariff.priceTenge,
            durationDays: tariff.durationDays,
            tariffKey: tariff.key,
            status: 'PAID',
            providerName: 'stub',
            providerRef: `seed-${user.id.slice(0, 6)}-${tariff.key}`,
            createdAt: grantedAt,
          },
        });
      }
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
