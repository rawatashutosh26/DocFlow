"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { History, RotateCcw, User, FileText, Sparkles } from 'lucide-react';

export interface VersionItem {
  id: string;
  documentId: string;
  documentTitle: string;
  version: number;
  createdAt: string;
  createdByName: string;
  kind: 'file' | 'content';
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function VersionHistoryList({
  versions,
  showDocumentTitle = true,
}: {
  versions: VersionItem[];
  showDocumentTitle?: boolean;
}) {
  const router = useRouter();

  const handleRestore = async (item: VersionItem) => {
    if (
      !confirm(
        `Restore "${item.documentTitle}" to version ${item.version}? The current state will be saved as a new version first.`
      )
    )
      return;

    try {
      const res = await fetch(`/api/documents/${item.documentId}/versions/${item.id}/restore`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Failed to restore version');
        return;
      }
      router.refresh();
    } catch {
      alert('An unexpected error occurred');
    }
  };

  if (versions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-slate-400 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
          <History className="w-6 h-6" />
        </div>
        <p className="font-semibold text-slate-700 text-sm">No version history yet</p>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Snapshots are automatically created each time you click &quot;Save Version&quot; or upload a file update.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
      {versions.map((item, idx) => (
        <div
          key={item.id}
          className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors gap-4 group"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold text-xs group-hover:scale-105 transition-transform">
              v{item.version}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-800">
                {showDocumentTitle ? (
                  <>
                    <Link
                      href={`/dashboard/files/${item.documentId}`}
                      className="font-bold text-slate-900 hover:text-indigo-600 hover:underline"
                    >
                      {item.documentTitle}
                    </Link>{' '}
                    <span className="text-slate-400">&mdash; checkpoint saved by </span>
                  </>
                ) : (
                  <span className="text-slate-400">Checkpoint saved by </span>
                )}
                <span className="font-semibold text-slate-800">{item.createdByName}</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {formatDateTime(item.createdAt)}
                {idx === 0 && (
                  <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-100">
                    <Sparkles className="w-2.5 h-2.5" /> Latest
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleRestore(item)}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/70 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex-shrink-0 active:scale-95"
            title={`Restore to version ${item.version}`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore</span>
          </button>
        </div>
      ))}
    </div>
  );
}
