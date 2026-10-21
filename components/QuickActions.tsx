"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, UploadCloud, Clock } from "lucide-react";
import UploadModal from "./UploadModal";
import { useTheme } from "./ThemeProvider";

interface QuickActionsProps {
  ownerId: string;
  pendingCount: number;
}

export default function QuickActions({ ownerId, pendingCount }: QuickActionsProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { isLight } = useTheme();

  return (
    <>
      <button
        onClick={() => setIsUploadOpen(true)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-900 font-medium text-xs transition-colors cursor-pointer group shadow-xs active:scale-[0.99]"
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center shadow-xs ${
            isLight ? 'bg-amber-500 text-white' : 'bg-zinc-900 text-zinc-50'
          }`}>
            <UploadCloud className="w-3.5 h-3.5" />
          </div>
          <span>Upload Document</span>
        </div>
        <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 transition-colors" />
      </button>

      <Link
        href="/dashboard/pending-approval"
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-900 font-medium text-xs transition-colors group shadow-xs active:scale-[0.99]"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-amber-600 text-white flex items-center justify-center shadow-xs">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <span>Pending Approvals ({pendingCount})</span>
        </div>
        <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 transition-colors" />
      </Link>

      <UploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} ownerId={ownerId} />
    </>
  );
}
