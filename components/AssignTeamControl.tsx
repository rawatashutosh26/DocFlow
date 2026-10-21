"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Loader2 } from 'lucide-react';

export interface TeamOption {
  id: string;
  name: string;
}

interface Props {
  folderId: string;
  currentTeamId: string | null;
  teams: TeamOption[];
}

export default function AssignTeamControl({ folderId, currentTeamId, teams }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const teamId = e.target.value || null;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/folders/${folderId}/assign-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Failed to assign team');
        return;
      }
      router.refresh();
    } catch {
      alert('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (teams.length === 0) {
    return (
      <span className="text-[11px] text-slate-400 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
        No teams available to assign.
      </span>
    );
  }

  return (
    <div className="relative inline-flex items-center">
      <select
        value={currentTeamId || ''}
        onChange={handleChange}
        disabled={isLoading}
        className="text-xs font-semibold border border-slate-200/90 rounded-xl px-3 py-1.5 bg-white text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
      >
        <option value="">No team (Private project)</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            Team: {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}