"use client";

import { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { getEditorExtensions } from './tiptap/extensions';
import Toolbar from './tiptap/Toolbar';
import SelectionBubbleMenu from './tiptap/SelectionBubbleMenu';
import ExportMenu from './ExportMenu';
import { Save, Check, Loader2, AlertCircle, Eye, Edit3 } from 'lucide-react';

interface DocumentEditorProps {
  documentId: string;
  documentTitle: string;
  initialContent: string;
  isReadOnly: boolean;
}

export default function DocumentEditor({
  documentId,
  documentTitle,
  initialContent,
  isReadOnly,
}: DocumentEditorProps) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [dirty, setDirty] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: getEditorExtensions(),
    content: initialContent || '',
    editable: !isReadOnly,
    editorProps: {
      attributes: {
        class: 'docmost-prose focus:outline-none',
      },
    },
    onUpdate: () => {
      setDirty(true);
    },
  });

  const saveDocument = useCallback(
    async (explicit: boolean) => {
      if (!editor) return;
      setSaveStatus('saving');
      try {
        const res = await fetch(
          `/api/documents/${documentId}/save${explicit ? '?explicit=1' : ''}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: editor.getHTML() }),
          }
        );

        if (!res.ok) throw new Error('Failed to save');

        setDirty(false);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } catch (error) {
        console.error(error);
        setSaveStatus('error');
      }
    },
    [documentId, editor]
  );

  useEffect(() => {
    if (isReadOnly || !dirty) return;
    const timer = setTimeout(() => {
      saveDocument(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [dirty, isReadOnly, saveDocument]);

  const wordCount = editor?.storage.characterCount?.words() ?? 0;
  const charCount = editor?.storage.characterCount?.characters() ?? 0;

  return (
    <div className="w-full rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden bg-white">
      {/* Top Status & Controls Bar */}
      <div className="bg-slate-50/90 border-b border-slate-200 px-5 py-2.5 flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            {isReadOnly ? (
              <>
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Read-Only Preview</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Editing Mode</span>
              </>
            )}
          </span>

          {!isReadOnly && (
            <div className="flex items-center gap-1.5 text-xs">
              {saveStatus === 'saving' && (
                <span className="flex items-center gap-1 text-indigo-600 font-medium animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" /> Saving changes...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> All changes saved
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="flex items-center gap-1 text-rose-600 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> Failed to save!
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isReadOnly && (
            <button
              onClick={() => saveDocument(true)}
              disabled={saveStatus === 'saving'}
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl px-3 py-1.5 transition-all shadow-xs cursor-pointer hover:shadow-sm active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Version</span>
            </button>
          )}
          <ExportMenu documentId={documentId} documentTitle={documentTitle} />
        </div>
      </div>

      {!isReadOnly && <Toolbar editor={editor} />}
      {editor && <SelectionBubbleMenu editor={editor} />}

      {/* Realistic Document Paper Canvas */}
      <div className="bg-slate-100/70 py-10 px-4 min-h-[800px] flex justify-center">
        <div className="docmost-page bg-white shadow-xl rounded-xl border border-slate-200/80">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Document Stats Footer */}
      <div className="flex justify-between items-center px-5 py-2.5 text-[11px] font-medium text-slate-400 border-t border-slate-200 bg-slate-50/50">
        <span>Rich Text Editor</span>
        <span>{wordCount} words · {charCount} characters</span>
      </div>

      <style jsx global>{`
        .docmost-page {
          width: 100%;
          max-width: 820px;
          min-height: 1000px;
        }
        .docmost-prose {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          font-size: 15px;
          line-height: 1.7;
          padding: 64px 72px;
          color: #1e293b;
        }
        .docmost-prose h1,
        .docmost-prose h2,
        .docmost-prose h3 {
          font-weight: 700;
          color: #0f172a;
          margin-top: 1.4em;
          margin-bottom: 0.5em;
          letter-spacing: -0.02em;
        }
        .docmost-prose h1 { font-size: 1.85em; }
        .docmost-prose h2 { font-size: 1.5em; }
        .docmost-prose h3 { font-size: 1.25em; }
        .docmost-prose p { margin: 0.7em 0; }
        .docmost-prose img { max-width: 100%; border-radius: 8px; margin: 1em 0; }
        .docmost-prose blockquote {
          border-left: 3px solid #6366f1;
          background: #f8fafc;
          margin: 1em 0;
          padding: 0.6em 1.2em;
          color: #475569;
          font-style: italic;
          border-radius: 0 8px 8px 0;
        }
        .docmost-prose pre {
          background: #0f172a;
          color: #f1f5f9;
          padding: 1em;
          border-radius: 8px;
          overflow-x: auto;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.85em;
          margin: 1em 0;
        }
        .docmost-prose code {
          background: #f1f5f9;
          color: #6366f1;
          padding: 0.15em 0.4em;
          border-radius: 4px;
          font-size: 0.9em;
        }
        .docmost-prose pre code {
          background: none;
          color: inherit;
          padding: 0;
        }
        .docmost-prose table {
          border-collapse: collapse;
          width: 100%;
          margin: 1.2em 0;
        }
        .docmost-prose th,
        .docmost-prose td {
          border: 1px solid #cbd5e1;
          padding: 0.6em 0.8em;
          text-align: left;
        }
        .docmost-prose th {
          background: #f8fafc;
          font-weight: 600;
          color: #0f172a;
        }
        .docmost-prose ul[data-type='taskList'] {
          list-style: none;
          padding-left: 0;
        }
        .docmost-prose ul[data-type='taskList'] li {
          display: flex;
          align-items: flex-start;
          gap: 0.5em;
        }
        .docmost-prose ul[data-type='taskList'] li > label {
          margin-top: 0.3em;
        }
        .docmost-prose hr {
          border: none;
          border-top: 1px solid #e2e8f0;
          margin: 2em 0;
        }
        .docmost-prose p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #94a3b8;
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </div>
  );
}