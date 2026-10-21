"use client";

import { Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { Bold, Italic, UnderlineIcon, Strikethrough, Highlighter, Link as LinkIcon } from 'lucide-react';

export default function SelectionBubbleMenu({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: 'top' }}
      shouldShow={({ state }) => !state.selection.empty}
      className="flex items-center gap-1 bg-slate-900/95 text-white rounded-xl shadow-2xl px-1.5 py-1 backdrop-blur-md border border-slate-700/80 animate-slide-up"
    >
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${editor.isActive('bold') ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        title="Bold"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${editor.isActive('italic') ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        title="Italic"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${editor.isActive('underline') ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        title="Underline"
      >
        <UnderlineIcon className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${editor.isActive('strike') ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        title="Strikethrough"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${editor.isActive('highlight') ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        title="Highlight"
      >
        <Highlighter className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={setLink}
        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${editor.isActive('link') ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
        title="Link"
      >
        <LinkIcon className="w-3.5 h-3.5" />
      </button>
    </BubbleMenu>
  );
}