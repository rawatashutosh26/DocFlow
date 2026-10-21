"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Star, Send, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import SubmitForApprovalModal from './SubmitForApprovalModal';

interface Props {
  documentId: string;
  documentTitle: string;
  status: string;
  isStarred: boolean;
  canSubmit: boolean;
}

export default function DocumentHeaderActions({ documentId, documentTitle, status, isStarred, canSubmit }: Props) {
  const router = useRouter();
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const handleStarToggle = async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}/star`, { method: 'POST' });
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

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pending Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            Needs Changes
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="flex items-center gap-2.5">
      {getStatusBadge(status)}

      <button
        onClick={handleStarToggle}
        title={isStarred ? 'Unstar' : 'Star document'}
        className={`p-2 rounded-xl border transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95 ${
          isStarred 
            ? 'text-amber-500 bg-amber-50/60 border-amber-200' 
            : 'text-slate-400 bg-white border-slate-200 hover:text-amber-500 hover:bg-amber-50/40'
        }`}
      >
        <Star className={`w-4 h-4 ${isStarred ? 'fill-current' : ''}`} />
      </button>

      {canSubmit && (status === 'DRAFT' || status === 'REJECTED') && (
        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer hover:shadow-sm active:scale-95"
        >
          <Send className="w-3.5 h-3.5" /> 
          <span>Submit for Review</span>
        </button>
      )}

      <SubmitForApprovalModal
        documentId={documentId}
        documentTitle={documentTitle}
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
      />
    </div>
  );
}