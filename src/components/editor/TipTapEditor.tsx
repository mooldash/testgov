'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface TipTapEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export function TipTapEditor({ value = '', onChange, className }: TipTapEditorProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      Image.configure({ inline: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Youtube.configure({ controls: true, nocookie: true }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: 'ProseMirror prose-content' },
    },
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  });

  // Sync external value into editor when it changes (e.g. switching tabs)
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) editor.commands.setContent(value || '<p></p>', false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  async function handleImageUpload(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('subdir', 'questions');
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    if (!res.ok) {
      alert('Upload failed');
      return;
    }
    const data = (await res.json()) as { url: string };
    editor!.chain().focus().setImage({ src: data.url }).run();
  }

  function addYoutube() {
    const url = window.prompt('YouTube URL:');
    if (!url) return;
    editor!.commands.setYoutubeVideo({ src: url, width: 640, height: 360 });
  }

  function addLink() {
    const url = window.prompt('URL:');
    if (!url) return;
    editor!.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
  }

  return (
    <div className={cn('border rounded-md bg-background', className)}>
      <div className="flex flex-wrap gap-1 border-b p-1">
        <ToolBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><b>B</b></ToolBtn>
        <ToolBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></ToolBtn>
        <ToolBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></ToolBtn>
        <ToolBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><s>S</s></ToolBtn>
        <Sep />
        <ToolBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</ToolBtn>
        <ToolBtn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</ToolBtn>
        <Sep />
        <ToolBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>•</ToolBtn>
        <ToolBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1.</ToolBtn>
        <ToolBtn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>&ldquo;</ToolBtn>
        <ToolBtn active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>{'</>'}</ToolBtn>
        <Sep />
        <ToolBtn onClick={addLink}>🔗</ToolBtn>
        <ToolBtn onClick={() => fileRef.current?.click()}>🖼</ToolBtn>
        <ToolBtn onClick={addYoutube}>▶</ToolBtn>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImageUpload(f);
            e.target.value = '';
          }}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolBtn({ children, onClick, active }: { children: React.ReactNode; onClick?: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-8 min-w-8 px-2 text-sm rounded hover:bg-muted transition-colors',
        active && 'bg-muted font-semibold'
      )}
    >
      {children}
    </button>
  );
}
function Sep() {
  return <div className="w-px bg-border my-1 mx-1" />;
}
