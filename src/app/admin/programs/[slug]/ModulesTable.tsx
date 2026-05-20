'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, GripVertical, BookOpen, Target, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { reorderModules, detachModuleFromProgramAction } from '../../actions';
import { ModuleEditButton } from '../../modules/ModuleDialog';
import { cn } from '@/lib/utils';

export type ModuleRow = {
  id: string;
  type: 'LAW' | 'TEST_COLLECTION';
  order: number;
  isPublished: boolean;
  displayTitle: string;
  testsCount: number;
  contentsCount: number;
};

const TYPE_LABEL_RU: Record<ModuleRow['type'], string> = {
  LAW: 'Материал',
  TEST_COLLECTION: 'Тест',
};

export function ModulesTable({
  initial,
  programId,
}: {
  initial: ModuleRow[];
  programId: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Sync local state when the server re-renders with new data (attach / detach / refresh)
  const initialKey = initial.map((r) => `${r.id}:${r.order}`).join(',');
  useEffect(() => {
    setRows(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey]);

  function onDragStart(id: string) {
    setDragId(id);
  }
  function onDragOver(e: React.DragEvent, overRowId: string) {
    e.preventDefault();
    if (overRowId !== overId) setOverId(overRowId);
  }
  function onDragEnd() {
    setDragId(null);
    setOverId(null);
  }
  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) {
      onDragEnd();
      return;
    }
    const next = [...rows];
    const fromIdx = next.findIndex((r) => r.id === dragId);
    const toIdx = next.findIndex((r) => r.id === targetId);
    if (fromIdx === -1 || toIdx === -1) {
      onDragEnd();
      return;
    }
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setRows(next);
    onDragEnd();
    startTransition(async () => {
      await reorderModules(programId, next.map((r) => r.id));
      router.refresh();
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8 p-0" />
          <TableHead>Название</TableHead>
          <TableHead className="w-28">Тип</TableHead>
          <TableHead className="w-24 text-right">Тестов</TableHead>
          <TableHead className="w-28 text-right">Материалов</TableHead>
          <TableHead className="w-12 text-center">✓</TableHead>
          <TableHead className="w-32 text-right">Действия</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
              В этой программе пока нет модулей.
            </TableCell>
          </TableRow>
        )}
        {rows.map((m) => {
          const Icon = m.type === 'LAW' ? BookOpen : Target;
          const isDragging = dragId === m.id;
          const isOver = overId === m.id && dragId && dragId !== m.id;
          return (
            <TableRow
              key={m.id}
              draggable
              onDragStart={() => onDragStart(m.id)}
              onDragOver={(e) => onDragOver(e, m.id)}
              onDrop={() => onDrop(m.id)}
              onDragEnd={onDragEnd}
              className={cn(
                'cursor-default select-none',
                isDragging && 'opacity-40',
                isOver && 'outline outline-2 outline-primary -outline-offset-2'
              )}
            >
              <TableCell className="p-0 text-center">
                <span
                  className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                  title="Перетащите для изменения порядка"
                  aria-label="Drag handle"
                >
                  <GripVertical className="h-4 w-4" />
                </span>
              </TableCell>
              <TableCell>
                <Link
                  href={`/admin/modules/${m.id}`}
                  className="font-medium hover:text-primary inline-flex items-center gap-1.5 group"
                >
                  {m.displayTitle}
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant={m.type === 'LAW' ? 'secondary' : 'outline'} className="gap-1 font-normal">
                  <Icon className="h-3 w-3" />
                  {TYPE_LABEL_RU[m.type]}
                </Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {m.testsCount}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {m.contentsCount}
              </TableCell>
              <TableCell className="text-center">
                {m.isPublished ? (
                  <span className="text-emerald-600">●</span>
                ) : (
                  <span className="text-muted-foreground">○</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <ModuleEditButton
                    module={{ id: m.id, type: m.type, isPublished: m.isPublished }}
                  />
                  <form action={detachModuleFromProgramAction}>
                    <input type="hidden" name="programId" value={programId} />
                    <input type="hidden" name="moduleId" value={m.id} />
                    <Button
                      type="submit"
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      title="Открепить от программы"
                    >
                      ✕
                    </Button>
                  </form>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
