import { Editor, Range } from '@tiptap/core';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Code2,
  Table as TableIcon,
  ImageIcon,
  Minus,
  Type,
  type LucideIcon,
} from 'lucide-react';

export interface CommandItem {
  title: string;
  description: string;
  icon: LucideIcon;
  searchTerms: string[];
  command: (props: { editor: Editor; range: Range }) => void;
}

// Opens the same hidden file input the toolbar's image button uses. Kept
// here as a small DOM-based bridge so the slash menu doesn't need direct
// access to the editor's image-upload plumbing.
export function insertImageViaPicker(editor: Editor, range?: Range) {
  if (range) {
    editor.chain().focus().deleteRange(range).run();
  }

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/png,image/jpeg,image/gif,image/webp,image/svg+xml';
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/assets/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to upload image');
        return;
      }
      editor.chain().focus().setImage({ src: data.url }).run();
    } catch {
      alert('An unexpected error occurred while uploading the image');
    }
  };
  input.click();
}

export const COMMAND_ITEMS: CommandItem[] = [
  {
    title: 'Text',
    description: 'Plain paragraph text',
    icon: Type,
    searchTerms: ['paragraph', 'text', 'p'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    title: 'Heading 1',
    description: 'Big section heading',
    icon: Heading1,
    searchTerms: ['h1', 'title', 'heading'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
    },
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: Heading2,
    searchTerms: ['h2', 'subtitle', 'heading'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
    },
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: Heading3,
    searchTerms: ['h3', 'heading'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
    },
  },
  {
    title: 'Bulleted List',
    description: 'A simple unordered list',
    icon: List,
    searchTerms: ['bullet', 'ul', 'list'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: 'Numbered List',
    description: 'A list with numbering',
    icon: ListOrdered,
    searchTerms: ['ordered', 'ol', 'number'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: 'To-do List',
    description: 'Checkboxes you can tick off',
    icon: ListTodo,
    searchTerms: ['todo', 'task', 'checkbox', 'checklist'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: 'Quote',
    description: 'Capture a quotation',
    icon: Quote,
    searchTerms: ['blockquote', 'quote', 'citation'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: 'Code Block',
    description: 'A block for code, with syntax highlighting',
    icon: Code2,
    searchTerms: ['code', 'codeblock', 'snippet'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: 'Table',
    description: 'Insert a 3x3 table',
    icon: TableIcon,
    searchTerms: ['table', 'grid', 'spreadsheet'],
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    },
  },
  {
    title: 'Image',
    description: 'Upload and embed an image',
    icon: ImageIcon,
    searchTerms: ['image', 'picture', 'photo', 'upload'],
    command: ({ editor, range }) => insertImageViaPicker(editor, range),
  },
  {
    title: 'Divider',
    description: 'A horizontal dividing line',
    icon: Minus,
    searchTerms: ['divider', 'hr', 'rule', 'separator'],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
];

export function getSuggestionItems(query: string): CommandItem[] {
  const q = query.toLowerCase();
  if (!q) return COMMAND_ITEMS.slice(0, 10);
  return COMMAND_ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.searchTerms.some((term) => term.includes(q))
  ).slice(0, 10);
}