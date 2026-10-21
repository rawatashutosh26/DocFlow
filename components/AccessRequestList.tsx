"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, Folder, Check, X, Clock, CheckCircle2, XCircle, KeyRound, User } from 'lucide-react';

export interface AccessRequestItem {
  id: string;
  resourceType: 'document' | 'folder';
  resourceId: string;
  resourceName: string;
  requestedLevel: string;
  status: string;
  message: string | null;
  createdAt: string;
  counterpartyName: string;
}

interface Props {
  received: AccessRequestItem[];
  sent: AccessRequestItem[];
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function ResourceLink({ item }: { item: AccessRequestItem }) {
  const href =
    item.resourceType === 'document'
      ? `/dashboard/files/${item.resourceId}`
      : `/dashboard/folders/${item.resourceId}`;
  const Icon = item.resourceType === 'document' ? FileText : Folder;
  return (
    <Link 
      href={href} 
      className="flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors"
    >
      <Icon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
      <span className="truncate">{item.resourceName}</span>
    </Link>
  );
}

export default function AccessRequestList({ received, sent }: Props) {
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const router = useRouter();

  const handleRespond = async (id: string, decision: 'APPROVED' | 'DENIED') => {
    try {
      const res = await fetch(`/api/access-requests/${id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Failed to respond to request');
        return;
      }
      router.refresh();
    } catch {
      alert('An unexpected error occurred');
    }
  };

  const pendingReceivedCount = received.filter((r) => r.status === 'PENDING').length;
  const list = tab === 'received' ? received : sent;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Approved
          </span>
        );
      case 'DENIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            Denied
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending Action
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Modern Segmented Tab Bar */}
      <div className="flex p-1 bg-slate-100 rounded-2xl w-fit border border-slate-200/80">
        <button
          onClick={() => setTab('received')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            tab === 'received'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Received Inbox</span>
          {pendingReceivedCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-extrabold shadow-xs">
              {pendingReceivedCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setTab('sent')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            tab === 'sent'
              ? 'bg-white text-indigo-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Sent Requests</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px] font-semibold">
            {sent.length}
          </span>
        </button>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-slate-400 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <p className="font-semibold text-slate-700 text-sm">
            {tab === 'received'
              ? "No incoming access requests pending."
              : "You haven't dispatched any access requests."}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Requests sent via search for locked documents and projects appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {list.map((item) => (
            <div key={item.id} className="px-6 py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
              <div className="min-w-0 flex-1">
                <ResourceLink item={item} />
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                  {tab === 'received' ? (
                    <>
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <User className="w-3 h-3 text-slate-400" />
                        {item.counterpartyName}
                      </span>
                      <span>requested</span>
                      <span className="font-bold text-indigo-600 uppercase text-[10px] tracking-wider px-2 py-0.2 rounded bg-indigo-50 border border-indigo-100">
                        {item.requestedLevel}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>Requested from</span>
                      <span className="font-semibold text-slate-800">{item.counterpartyName}</span>
                      <span>level:</span>
                      <span className="font-bold text-indigo-600 uppercase text-[10px] tracking-wider px-2 py-0.2 rounded bg-indigo-50 border border-indigo-100">
                        {item.requestedLevel}
                      </span>
                    </>
                  )}
                  <span>·</span>
                  <span className="text-slate-400">{formatDate(item.createdAt)}</span>
                </p>

                {item.message && (
                  <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                    &quot;{item.message}&quot;
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {tab === 'received' && item.status === 'PENDING' ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRespond(item.id, 'APPROVED')}
                      className="flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => handleRespond(item.id, 'DENIED')}
                      className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer active:scale-95"
                    >
                      <X className="w-3.5 h-3.5" /> Deny
                    </button>
                  </div>
                ) : (
                  getStatusBadge(item.status)
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
