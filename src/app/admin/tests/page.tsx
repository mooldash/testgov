import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default async function AdminTestsPage() {
  const tests = await prisma.test.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      module: { include: { program: true } },
      _count: { select: { questions: true } },
    },
  });

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Тесты</h1>
      </div>
      {tests.map((t) => (
        <Card key={t.id}>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <div className="font-medium">{t.title}</div>
              <div className="text-xs text-muted-foreground mt-1 flex gap-2 flex-wrap">
                <Badge variant="outline">{t.locale}</Badge>
                <Badge variant="secondary">{t.mode}</Badge>
                <span>· {t.module.program.nameRu}</span>
                <span>· вопросов: {t._count.questions}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/admin/tests/${t.id}/questions`}><Button size="sm" variant="outline">Вопросы</Button></Link>
              <Link href={`/admin/tests/${t.id}/settings`}><Button size="sm" variant="outline">Настройки</Button></Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
