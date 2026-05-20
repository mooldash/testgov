import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, FolderTree } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ModuleContentEditor } from './ModuleContentEditor';
import { TestCard } from './TestCard';

const TYPE_LABEL_RU = {
  LAW: 'Учебный материал',
  TEST_COLLECTION: 'Сборник тестов',
} as const;

export default async function ModuleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const module = await prisma.module.findUnique({
    where: { id },
    include: {
      contents: true,
      tests: { include: { _count: { select: { questions: true } } } },
      programs: {
        include: { program: { select: { slug: true, nameRu: true, nameKk: true } } },
        orderBy: { order: 'asc' },
      },
    },
  });
  if (!module) notFound();

  const ru = module.contents.find((c) => c.locale === 'RU');
  const kk = module.contents.find((c) => c.locale === 'KK');
  const ruTest = module.tests.find((t) => t.locale === 'RU');
  const kkTest = module.tests.find((t) => t.locale === 'KK');

  const typeLabel = TYPE_LABEL_RU[module.type];
  // Real human-readable module name: LAW content title, or RU test title, or first program name
  const moduleName =
    ru?.title ||
    ruTest?.title ||
    kk?.title ||
    kkTest?.title ||
    typeLabel;

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground flex items-center gap-1 flex-wrap">
        <Link href="/admin/modules" className="hover:text-foreground">Модули</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground line-clamp-1">{moduleName}</span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold">{moduleName}</h1>
        <p className="text-sm text-muted-foreground mt-1">{typeLabel}</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-muted-foreground" />
            В программах ({module.programs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {module.programs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Модуль не привязан ни к одной программе. Откройте программу и нажмите «Добавить модуль».
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {module.programs.map((pm) => (
                <Link key={pm.programId} href={`/admin/programs/${pm.program.slug}`}>
                  <Badge variant="secondary" className="hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors">
                    {pm.program.nameRu}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {module.type === 'LAW' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Учебный материал</CardTitle>
          </CardHeader>
          <CardContent>
            <ModuleContentEditor
              moduleId={module.id}
              ru={{ title: ru?.title ?? '', bodyHtml: ru?.bodyHtml ?? '' }}
              kk={{ title: kk?.title ?? '', bodyHtml: kk?.bodyHtml ?? '' }}
            />
          </CardContent>
        </Card>
      )}

      {module.type === 'TEST_COLLECTION' && (
        <div className="grid md:grid-cols-2 gap-4">
          <TestCard
            locale="RU"
            moduleId={module.id}
            test={ruTest ?? null}
            questionsCount={ruTest?._count.questions ?? 0}
          />
          <TestCard
            locale="KK"
            moduleId={module.id}
            test={kkTest ?? null}
            questionsCount={kkTest?._count.questions ?? 0}
          />
        </div>
      )}
    </div>
  );
}
