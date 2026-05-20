'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Settings, FileQuestion, Plus, ChevronDown } from 'lucide-react';
import type { Test } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TestSettingsForm } from '@/app/admin/tests/[id]/settings/TestSettingsForm';
import { cn } from '@/lib/utils';

const MODE_LABEL_RU: Record<string, string> = {
  CLASSIC: 'Классический',
  CLASSIC_WITH_BACK: 'Классический с возвратом',
  INSTANT_FEEDBACK: 'Мгновенная обратная связь',
  ALL_QUESTIONS_PAGE: 'Все вопросы на странице',
};

const LOCALE_LABEL: Record<'RU' | 'KK', string> = {
  RU: 'Русская версия',
  KK: 'Қазақша нұсқа',
};

export function TestCard({
  locale,
  moduleId,
  test,
  questionsCount,
}: {
  locale: 'RU' | 'KK';
  moduleId: string;
  test: Test | null;
  questionsCount?: number;
}) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">{LOCALE_LABEL[locale]}</CardTitle>
        {test && (
          <span
            className={
              test.isPublished
                ? 'text-xs text-emerald-600'
                : 'text-xs text-muted-foreground'
            }
          >
            {test.isPublished ? '● опубликован' : '○ черновик'}
          </span>
        )}
      </CardHeader>
      <CardContent>
        {test ? (
          <div className="space-y-4">
            <div>
              <div className="font-medium leading-tight">{test.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {MODE_LABEL_RU[test.mode] ?? test.mode} · вопросов: {questionsCount ?? 0}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={`/admin/tests/${test.id}/questions`}>
                <Button size="sm" variant="outline">
                  <FileQuestion className="h-3.5 w-3.5 mr-1.5" />
                  Вопросы
                </Button>
              </Link>
              <Button
                size="sm"
                variant={showSettings ? 'secondary' : 'outline'}
                onClick={() => setShowSettings((v) => !v)}
                aria-expanded={showSettings}
              >
                <Settings className="h-3.5 w-3.5 mr-1.5" />
                Настройки
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 ml-1 transition-transform',
                    showSettings && 'rotate-180'
                  )}
                />
              </Button>
            </div>

            {showSettings && (
              <div className="mt-4 pt-4 border-t">
                <TestSettingsForm test={test} moduleId={moduleId} />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3 py-2">
            <p className="text-sm text-muted-foreground">
              На этом языке теста ещё нет.
            </p>
            <Link href={`/admin/tests/new?moduleId=${moduleId}&locale=${locale}`}>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1.5" />
                Создать тест
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
