import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AdminDashboard() {
  const [users, categories, programs, modules, tests, attempts, activeAccess] = await Promise.all([
    prisma.user.count(),
    prisma.category.count(),
    prisma.program.count(),
    prisma.module.count(),
    prisma.test.count(),
    prisma.attempt.count({ where: { finishedAt: { not: null } } }),
    prisma.userAccess.count({ where: { expiresAt: { gt: new Date() } } }),
  ]);

  const stats = [
    { label: 'Пользователи', value: users },
    { label: 'Категории', value: categories },
    { label: 'Программы', value: programs },
    { label: 'Модули', value: modules },
    { label: 'Тесты', value: tests },
    { label: 'Завершённых попыток', value: attempts },
    { label: 'Активных доступов', value: activeAccess },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Обзор</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-normal text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tabular-nums">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
