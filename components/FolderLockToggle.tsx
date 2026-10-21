"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Unlock, Loader2 } from 'lucide-react';

export default function FolderLockToggle({ folderId, isLocked }: { folderId: string; isLocked: boolean }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/folders/${folderId}/lock`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Failed to update lock state');
        return;
      }
      router.refresh();
    } catch {
      alert('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all disabled:opacity-50 cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-[0.98] ${
        isLocked
          ? 'text-amber-800 bg-amber-50 border-amber-200 hover:bg-amber-100'
          : 'text-slate-700 bg-white border-slate-200/90 hover:bg-slate-50 hover:border-slate-300'
      }`}
      title={isLocked ? "Click to unlock (make private to you)" : "Click to lock (allow others to request access)"}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
      ) : isLocked ? (
        <Lock className="w-3.5 h-3.5 text-amber-600" />
      ) : (
        <Unlock className="w-3.5 h-3.5 text-slate-500" />
      )}
      <span>{isLocked ? 'Locked (Others can request)' : 'Unlocked (Private)'}</span>
    </button>
  );
}