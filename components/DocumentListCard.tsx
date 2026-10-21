"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Star, 
  RotateCcw, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Check, 
  X,
  FileSpreadsheet,
  FileImage,
  FileCode,
  AlertCircle
} from 'lucide-react';

export interface DocListItem {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  ownerName?: string | null;
  isStarred?: boolean;
}

export type ListVariant =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'requests'
  | 'starred'
  | 'recent'
  | 'trash';

interface Props {
  documents: DocListItem[];
  variant: ListVariant;
  emptyMessage: string;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getFileIcon(title: string) {
  const ext = title.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return <FileText className="w-4.5 h-4.5 text-rose-500" />;
    case 'xlsx':
    case 'xls':
    case 'csv':
      return <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-500" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'webp':
      return <FileImage className="w-4.5 h-4.5 text-purple-500" />;
    case 'ts':
    case 'js':
    case 'json':
      return <FileCode className="w-4.5 h-4.5 text-cyan-500" />;
    default:
      return <FileText className="w-4.5 h-4.5 text-indigo-500" />;
  }
}

export default function DocumentListCard({ documents, variant, emptyMessage }: Props) {
  const router = useRouter();

  const handleStarToggle = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}/star`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to update star');
        return;
      }
      router.refresh();
    } catch {
      alert('An unexpected error occurred');
    }
  };

  const handleReview = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    const comment =
      decision === 'REJECTED'
        ? window.prompt('Reason for requesting changes (optional):') || undefined
        : undefined;

    try {
      const res = await fetch(`/api/documents/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, comment }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Failed to submit review');
        return;
      }
      router.refresh();
    } catch {
      alert('An unexpected error occurred');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}/restore`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Failed to restore document');
        return;
      }
      router.refresh();
    } catch {
      alert('An unexpected error occurred');
    }
  };

  const handlePermanentDelete = async (id: string, title: string) => {
    if (!confirm(`Permanently delete "${title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/documents/${id}/permanent-delete`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Failed to permanently delete document');
        return;
      }
      router.refresh();
    } catch {
      alert('An unexpected error occurred');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Approved
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Needs Changes
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
            Draft
          </span>
        );
    }
  };

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-slate-400 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <p className="font-semibold text-slate-700 text-sm">{emptyMessage}</p>
        <p className="text-xs text-slate-400 mt-1">Items that match this filter will automatically appear here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors gap-4 group"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-50 transition-colors">
              {getFileIcon(doc.title)}
            </div>

            <div className="min-w-0">
              {variant === 'trash' ? (
                <p className="text-sm font-semibold text-slate-500 truncate line-through">{doc.title}</p>
              ) : (
                <Link
                  href={`/dashboard/files/${doc.id}`}
                  className="text-sm font-semibold text-slate-900 hover:text-indigo-600 transition-colors truncate block"
                >
                  {doc.title}
                </Link>
              )}
              
              <div className="text-xs text-slate-400 flex items-center gap-2.5 mt-0.5 flex-wrap">
                {doc.ownerName && (
                  <span className="flex items-center gap-1 text-slate-600 font-medium">
                    <User className="w-3 h-3 text-slate-400" />
                    {doc.ownerName}
                  </span>
                )}
                <span>{formatDate(doc.updatedAt)}</span>
                {variant !== 'trash' && doc.status && getStatusBadge(doc.status)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {variant !== 'trash' && variant !== 'requests' && (
              <button
                onClick={() => handleStarToggle(doc.id)}
                title={doc.isStarred ? 'Unstar' : 'Star'}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  doc.isStarred ? 'text-amber-500 hover:bg-amber-50' : 'text-slate-300 hover:text-amber-500 hover:bg-slate-100'
                }`}
              >
                <Star className={`w-4 h-4 ${doc.isStarred ? 'fill-current' : ''}`} />
              </button>
            )}

            {variant === 'requests' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleReview(doc.id, 'APPROVED')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                  title="Approve document"
                >
                  <Check className="w-3.5 h-3.5" /> Approve
                </button>
                <button
                  onClick={() => handleReview(doc.id, 'REJECTED')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer active:scale-95"
                  title="Request changes"
                >
                  <X className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            )}

            {variant === 'trash' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRestore(doc.id)}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/70 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                  title="Restore to workspace"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Restore
                </button>
                <button
                  onClick={() => handlePermanentDelete(doc.id, doc.title)}
                  className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/70 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                  title="Permanently remove"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Forever
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
