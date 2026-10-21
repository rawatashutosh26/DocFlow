"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Share2, Mail, Shield, Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
}

export default function ShareModal({ isOpen, onClose, documentId, documentTitle }: ShareModalProps) {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState<'VIEWER' | 'EDITOR'>('VIEWER');
  const [canDownload, setCanDownload] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'Sharing document...' });

    try {
      const res = await fetch(`/api/documents/${documentId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          accessLevel: accessLevel,
          canDownload: canDownload,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: 'error', message: data.error || 'Failed to share document' });
      } else {
        setStatus({ type: 'success', message: 'Document shared successfully!' });
        setTimeout(() => {
          onClose();
          setStatus({ type: 'idle', message: '' });
          setEmail('');
        }, 1500);
      }
    } catch {
      setStatus({ type: 'error', message: 'An unexpected error occurred' });
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
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Share Document</h2>
            <p className="text-xs text-slate-500 truncate max-w-xs">&quot;{documentTitle}&quot;</p>
          </div>
        </div>

        <form onSubmit={handleShare} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">User Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Permission Level</label>
            <div className="relative">
              <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value as 'VIEWER' | 'EDITOR')}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="VIEWER">Viewer (Read-only access)</option>
                <option value="EDITOR">Editor (Can view and modify content)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <input
              type="checkbox"
              id="canDownload"
              checked={canDownload}
              onChange={(e) => setCanDownload(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
            />
            <label htmlFor="canDownload" className="text-xs font-medium text-slate-700 cursor-pointer select-none">
              Allow recipient to download raw file
            </label>
          </div>

          {status.message && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 animate-fade-in ${
              status.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 
              status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
              'bg-indigo-50 text-indigo-700 border border-indigo-200'
            }`}>
              {status.type === 'error' && <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />}
              {status.type === 'success' && <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />}
              {status.type === 'loading' && <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin text-indigo-600" />}
              <span>{status.message}</span>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status.type === 'loading'}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {status.type === 'loading' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sharing...</span>
                </>
              ) : (
                <span>Share Access</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}