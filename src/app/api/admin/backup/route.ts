import { spawn } from 'node:child_process';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/backup
 * Streams a pg_dump SQL backup of the database to the browser
 * as a downloadable .sql attachment. Admin-only.
 *
 * Requires `pg_dump` binary to be available in the runtime container
 * (see Dockerfile — alpine `postgresql16-client` package).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return new Response('Unauthorized', { status: 401 });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return new Response('DATABASE_URL not configured', { status: 500 });
  }

  // Parse connection info out of DATABASE_URL.
  // Form: postgresql://user:password@host:port/db?schema=public
  let conn: URL;
  try {
    conn = new URL(databaseUrl);
  } catch {
    return new Response('Invalid DATABASE_URL', { status: 500 });
  }

  // Pass connection info via PG* env vars — keeps password out of argv
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PGHOST: conn.hostname,
    PGPORT: conn.port || '5432',
    PGUSER: decodeURIComponent(conn.username),
    PGPASSWORD: decodeURIComponent(conn.password),
    PGDATABASE: conn.pathname.replace(/^\//, '').split('?')[0],
  };

  // --no-owner / --no-privileges: portable dump (can be restored to a fresh DB)
  // --clean --if-exists: drop existing objects before recreate on restore
  const proc = spawn(
    'pg_dump',
    ['--no-owner', '--no-privileges', '--clean', '--if-exists'],
    { env }
  );

  let stderrBuf = '';
  proc.stderr.on('data', (d: Buffer) => {
    stderrBuf += d.toString();
  });

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      proc.stdout.on('data', (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
      proc.stdout.on('end', () => controller.close());
      proc.on('error', (err) => controller.error(err));
      proc.on('exit', (code) => {
        if (code !== 0) {
          controller.error(new Error(`pg_dump exited with code ${code}: ${stderrBuf}`));
        }
      });
    },
    cancel() {
      proc.kill('SIGTERM');
    },
  });

  const stamp = new Date()
    .toISOString()
    .replace(/[T:]/g, '-')
    .replace(/\..+$/, '');

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/sql; charset=utf-8',
      'Content-Disposition': `attachment; filename="testgov-backup-${stamp}.sql"`,
      'Cache-Control': 'no-store',
    },
  });
}
