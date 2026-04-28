import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Storage } from './index';

export class LocalStorage implements Storage {
  private uploadDir: string;
  private publicPath: string;

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR ?? './uploads';
    this.publicPath = process.env.PUBLIC_UPLOAD_PATH ?? '/uploads';
  }

  async save(
    file: { buffer: Buffer; filename: string; mimeType: string },
    subdir = 'misc'
  ): Promise<{ url: string; key: string }> {
    const ext = path.extname(file.filename) || extFromMime(file.mimeType);
    const id = randomUUID();
    const relPath = path.posix.join(subdir, `${id}${ext}`);
    const fullDir = path.join(this.uploadDir, subdir);
    await fs.mkdir(fullDir, { recursive: true });
    await fs.writeFile(path.join(this.uploadDir, relPath), file.buffer);
    return {
      url: path.posix.join(this.publicPath, relPath),
      key: relPath,
    };
  }

  async delete(key: string): Promise<void> {
    const full = path.join(this.uploadDir, key);
    await fs.unlink(full).catch(() => undefined);
  }
}

function extFromMime(mime: string): string {
  switch (mime) {
    case 'image/png':
      return '.png';
    case 'image/jpeg':
      return '.jpg';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    case 'image/svg+xml':
      return '.svg';
    default:
      return '';
  }
}
