import { prisma } from '@/lib/prisma';

export class AccessDeniedError extends Error {
  constructor(message = 'Access denied') {
    super(message);
    this.name = 'AccessDeniedError';
  }
}

/**
 * Returns true if:
 *  - the program is marked as demo (anonymous access allowed), OR
 *  - the user is an admin, OR
 *  - the user has an active paid UserAccess for this program.
 *
 * `userId === null` is supported — used for anonymous demo browsing.
 */
export async function hasProgramAccess(
  userId: string | null,
  programId: string
): Promise<boolean> {
  // Cheap check first: demo programs are open to everyone
  const program = await prisma.program.findUnique({
    where: { id: programId },
    select: { isDemo: true },
  });
  if (!program) return false;
  if (program.isDemo) return true;

  if (!userId) return false;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  const access = await prisma.userAccess.findFirst({
    where: { userId, programId, expiresAt: { gt: new Date() } },
  });
  return Boolean(access);
}

export async function assertProgramAccess(userId: string | null, programId: string): Promise<void> {
  const ok = await hasProgramAccess(userId, programId);
  if (!ok) throw new AccessDeniedError();
}

export async function hasTestAccess(userId: string | null, testId: string): Promise<boolean> {
  // A test is accessible if it belongs to a demo program, the user is admin,
  // or the user has access to ANY program that contains its module.
  const test = await prisma.test.findUnique({
    where: { id: testId },
    select: {
      module: {
        select: {
          programs: {
            select: { program: { select: { id: true, isDemo: true } } },
          },
        },
      },
    },
  });
  if (!test) return false;

  const programs = test.module.programs.map((pm) => pm.program);
  if (programs.length === 0) return false;

  // Demo escape: if at least one parent program is demo → free access
  if (programs.some((p) => p.isDemo)) return true;

  if (!userId) return false;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return false;
  if (user.role === 'ADMIN') return true;

  const access = await prisma.userAccess.findFirst({
    where: {
      userId,
      programId: { in: programs.map((p) => p.id) },
      expiresAt: { gt: new Date() },
    },
  });
  return Boolean(access);
}

export async function assertTestAccess(userId: string | null, testId: string): Promise<void> {
  const ok = await hasTestAccess(userId, testId);
  if (!ok) throw new AccessDeniedError();
}
