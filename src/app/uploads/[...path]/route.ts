import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await ctx.params;
  const root = path.resolve(process.env.UPLOAD_DIR ?? './uploads');
  const target = path.resolve(root, ...parts);
  if (!target.startsWith(root)) return NextResponse.json({ error: 'Bad path' }, { status: 400 });

  try {
    const data = await fs.readFile(target);
    const ext = path.extname(target).toLowerCase();
    const type = TYPES[ext] ?? 'application/octet-stream';
    return new NextResponse(data, {
      headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=31536000, immutable' },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
