import { prisma } from '@/lib/prisma';

export class AccessDeniedError extends Error {
  constructor(message = 'Access denied') {
    super(message);
    this.name = 'AccessDeniedError';
  }
}

export async function hasProgramAccess(userId: string, programId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  const access = await prisma.userAccess.findFirst({
    where: { userId, programId, expiresAt: { gt: new Date() } },
  });
  return Boolean(access);
}

export async function assertProgramAccess(userId: string, programId: string): Promise<void> {
  const ok = await hasProgramAccess(userId, programId);
  if (!ok) throw new AccessDeniedError();
}

export async function hasTestAccess(userId: string, testId: string): Promise<boolean> {
  // A test is accessible if the user has access to ANY program that contains this module
  const test = await prisma.test.findUnique({
    where: { id: testId },
    select: {
      module: {
        select: {
          programs: { select: { programId: true } },
        },
      },
    },
  });
  if (!test) return false;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return false;
  if (user.role === 'ADMIN') return true;

  const programIds = test.module.programs.map((pm) => pm.programId);
  if (programIds.length === 0) return false;

  const access = await prisma.userAccess.findFirst({
    where: { userId, programId: { in: programIds }, expiresAt: { gt: new Date() } },
  });
  return Boolean(access);
}

export async function assertTestAccess(userId: string, testId: string): Promise<void> {
  const ok = await hasTestAccess(userId, testId);
  if (!ok) throw new AccessDeniedError();
}
