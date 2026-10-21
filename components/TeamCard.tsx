"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserPlus, X, Shield, Mail, Loader2 } from 'lucide-react';

export interface TeamMemberInfo {
  userId: string;
  name: string;
  email: string;
  role: 'LEAD' | 'MEMBER';
}

interface Props {
  teamId: string;
  teamName: string;
  description: string | null;
  members: TeamMemberInfo[];
  isCurrentUserLead: boolean;
}

export default function TeamCard({ teamId, teamName, description, members, isCurrentUserLead }: Props) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Failed to add member');
        return;
      }
      setEmail('');
      router.refresh();
    } catch {
      alert('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Remove this member from the team?')) return;
    try {
      const res = await fetch(`/api/teams/${teamId}/members?userId=${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Failed to remove member');
        return;
      }
      router.refresh();
    } catch {
      alert('An unexpected error occurred');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">{teamName}</h3>
            {description && <p className="text-xs text-slate-500 line-clamp-1">{description}</p>}
          </div>
        </div>

        <div className="mt-4 space-y-1.5 divide-y divide-slate-100">
          {members.map((m) => (
            <div key={m.userId} className="flex items-center justify-between text-xs py-2 px-1 rounded-lg hover:bg-slate-50/80 transition-colors">
              <span className="flex items-center gap-2 text-slate-700 min-w-0">
                {m.role === 'LEAD' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <Shield className="w-3 h-3 text-amber-600" /> Lead
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    Member
                  </span>
                )}
                <span className="font-semibold text-slate-900 truncate">{m.name}</span>
                <span className="text-slate-400 text-[11px] truncate hidden sm:inline">({m.email})</span>
              </span>

              {isCurrentUserLead && (
                <button
                  onClick={() => handleRemoveMember(m.userId)}
                  className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                  title="Remove from team"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {isCurrentUserLead && (
        <form onSubmit={handleAddMember} className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100">
          <div className="relative flex-1">
            <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@company.com"
              className="w-full pl-8.5 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-slate-400"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-xl transition-all shadow-2xs disabled:opacity-50 cursor-pointer active:scale-95"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
            <span>Add</span>
          </button>
        </form>
      )}
    </div>
  );
}
