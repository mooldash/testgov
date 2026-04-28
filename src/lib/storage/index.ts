export interface Storage {
  save(file: { buffer: Buffer; filename: string; mimeType: string }, subdir?: string): Promise<{ url: string; key: string }>;
  delete(key: string): Promise<void>;
}

import { LocalStorage } from './local';

let _storage: Storage | null = null;

export function getStorage(): Storage {
  if (_storage) return _storage;
  const driver = process.env.STORAGE_DRIVER ?? 'local';
  if (driver === 'local') {
    _storage = new LocalStorage();
  } else {
    throw new Error(`Unknown STORAGE_DRIVER: ${driver}`);
  }
  return _storage;
}
