'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import { useEffect, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link2,
  Image as ImageIcon,
  Youtube as YoutubeIcon,
  Undo2,
  Redo2,
} from 'lucide-react';
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
      <div className="flex flex-wrap items-center gap-0.5 border-b p-1.5">
        <ToolBtn
          title="Отменить (Ctrl+Z)"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo2 className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn
          title="Повторить (Ctrl+Shift+Z)"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo2 className="h-4 w-4" />
        </ToolBtn>
        <Sep />
        <ToolBtn title="Bold (Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn title="Italic (Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn title="Underline (Ctrl+U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="h-4 w-4" />
        </ToolBtn>
        <Sep />
        <ToolBtn title="Заголовок H2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn title="Заголовок H3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="h-4 w-4" />
        </ToolBtn>
        <Sep />
        <ToolBtn title="Маркированный список" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn title="Нумерованный список" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn title="Цитата" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn title="Код" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
          <Code className="h-4 w-4" />
        </ToolBtn>
        <Sep />
        <ToolBtn title="Ссылка" active={editor.isActive('link')} onClick={addLink}>
          <Link2 className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn title="Изображение" onClick={() => fileRef.current?.click()}>
          <ImageIcon className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn title="YouTube" onClick={addYoutube}>
          <YoutubeIcon className="h-4 w-4" />
        </ToolBtn>
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
      <div className="resize-y overflow-auto min-h-[280px] max-h-[800px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolBtn({
  children,
  onClick,
  active,
  title,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        'h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
        active && 'bg-muted text-foreground',
        disabled && 'opacity-40 pointer-events-none'
      )}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-5 bg-border mx-0.5" />;
}
