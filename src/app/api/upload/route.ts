import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getStorage } from '@/lib/storage';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const fd = await req.formData();
  const file = fd.get('file');
  const subdir = (fd.get('subdir') as string | null) ?? 'misc';
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Too large' }, { status: 413 });
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: 'Invalid type' }, { status: 415 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const saved = await getStorage().save({ buffer, filename: file.name, mimeType: file.type }, sanitizeSub(subdir));
  return NextResponse.json({ url: saved.url, key: saved.key });
}

function sanitizeSub(s: string): string {
  return s.replace(/[^a-z0-9-_/]/gi, '').slice(0, 64) || 'misc';
}
