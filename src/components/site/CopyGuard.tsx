'use client';

import { useEffect } from 'react';

function isEditable(t: EventTarget | null): boolean {
  if (!t || !(t instanceof Element)) return false;
  if (t.closest('input, textarea, [contenteditable=""], [contenteditable="true"]')) return true;
  return false;
}

export function CopyGuard() {
  useEffect(() => {
    const onCopy = (e: ClipboardEvent) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
    };
    const onCut = (e: ClipboardEvent) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
    };
    const onContext = (e: MouseEvent) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
    };
    const onSelectStart = (e: Event) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
    };
    document.addEventListener('copy', onCopy);
    document.addEventListener('cut', onCut);
    document.addEventListener('contextmenu', onContext);
    document.addEventListener('selectstart', onSelectStart);
    document.body.classList.add('copy-guarded');
    return () => {
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('cut', onCut);
      document.removeEventListener('contextmenu', onContext);
      document.removeEventListener('selectstart', onSelectStart);
      document.body.classList.remove('copy-guarded');
    };
  }, []);
  return null;
}
