"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { X, Send, Mail, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';

interface Props {
  documentId: string;
  documentTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function SubmitForApprovalModal({ documentId, documentTitle, isOpen, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState<'VIEWER' | 'EDITOR'>('VIEWER');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerEmail.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/documents/${documentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerEmail, accessLevel }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Failed to submit for approval');
        return;
      }

      onClose();
      setReviewerEmail('');
      router.refresh();
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative border border-slate-200/90 my-auto animate-slide-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Send className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Submit for Approval</h2>
            <p className="text-xs text-slate-500 truncate max-w-xs">&quot;{documentTitle}&quot;</p>
          </div>
        </div>

        <p className="text-xs text-slate-500 my-4 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
          This document will transition to <span className="font-semibold text-amber-700">Pending Review</span> and be routed to your chosen reviewer to approve or request changes.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Reviewer&apos;s Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={reviewerEmail}
                onChange={(e) => setReviewerEmail(e.target.value)}
                placeholder="lead@company.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder-slate-400"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Access level to grant reviewer
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label 
                className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs font-medium transition-all ${
                  accessLevel === 'VIEWER' 
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="access"
                  checked={accessLevel === 'VIEWER'}
                  onChange={() => setAccessLevel('VIEWER')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span>Read-Only Viewer</span>
              </label>

              <label 
                className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs font-medium transition-all ${
                  accessLevel === 'EDITOR' 
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="access"
                  checked={accessLevel === 'EDITOR'}
                  onChange={() => setAccessLevel('EDITOR')}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <span>Co-Editor</span>
              </label>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50 transition-all shadow-xs cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit for Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}