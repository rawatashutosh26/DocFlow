"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Check, X, Loader2 } from 'lucide-react';

interface Props {
  documentId: string;
  initialDescription: string | null;
  canEdit: boolean;
}

export default function DocumentDescriptionEditor({ documentId, initialDescription, canEdit }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialDescription || '');
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/description`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Failed to update description');
        return;
      }
      setIsEditing(false);
      router.refresh();
    } catch {
      alert('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-start gap-2 mt-2 max-w-xl animate-fade-in">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={2}
          autoFocus
          placeholder="What is this document about? (helps others discover it via search)"
          className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 resize-none shadow-2xs"
        />
        <div className="flex flex-col gap-1">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="p-1.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
            title="Save description"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setValue(initialDescription || '');
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-1 group">
      <p className="text-xs text-slate-500 max-w-xl">
        {initialDescription || <span className="italic text-slate-400">No description provided</span>}
      </p>
      {canEdit && (
        <button
          onClick={() => setIsEditing(true)}
          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 p-1 hover:bg-slate-100 rounded-md transition-all cursor-pointer"
          title="Edit description"
        >
          <Pencil className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}