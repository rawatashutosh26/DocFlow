"use client";

import { useRouter } from 'next/navigation';
import { FolderPlus } from 'lucide-react';

export default function CreateFolderButton({ parentId }: { parentId?: string }) {
  const router = useRouter();

  const handleCreate = async () => {
    const name = window.prompt(parentId ? "New subfolder name:" : "New project (folder) name:");
    if (!name || !name.trim()) return;

    try {
      const res = await fetch('/api/folders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Failed to create folder');
        return;
      }
      router.refresh();
    } catch {
      alert('An unexpected error occurred while creating the folder');
    }
  };

  return (
    <button
      onClick={handleCreate}
      className="flex items-center gap-1.5 bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-xl transition-all text-xs font-semibold shadow-xs hover:border-slate-300 active:scale-[0.98] cursor-pointer"
    >
      <FolderPlus className="w-4 h-4 text-indigo-600" />
      <span>{parentId ? 'New Subfolder' : 'New Project'}</span>
    </button>
  );
}