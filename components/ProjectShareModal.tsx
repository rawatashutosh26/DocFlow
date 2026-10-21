"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { X, Share2, User, Users, Trash2, Mail, Shield, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export interface ProjectShareUser {
  userId: string;
  name: string;
  email: string;
  accessLevel: 'VIEWER' | 'EDITOR';
}

export interface ProjectShareTeam {
  teamId: string;
  name: string;
  accessLevel: 'VIEWER' | 'EDITOR';
}

interface Props {
  folderId: string;
  folderName: string;
  availableTeams: { id: string; name: string }[];
  sharedUsers: ProjectShareUser[];
  sharedTeams: ProjectShareTeam[];
}

export default function ProjectShareModal({
  folderId,
  folderName,
  availableTeams,
  sharedUsers,
  sharedTeams,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<'person' | 'team'>('person');
  const [email, setEmail] = useState('');
  const [teamId, setTeamId] = useState(availableTeams[0]?.id || '');
  const [accessLevel, setAccessLevel] = useState<'VIEWER' | 'EDITOR'>('VIEWER');
  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: '',
  });
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'Sharing project...' });

    try {
      const res = await fetch(
        mode === 'person' ? `/api/folders/${folderId}/share` : `/api/folders/${folderId}/share-team`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            mode === 'person' ? { email, accessLevel } : { teamId, accessLevel }
          ),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ type: 'error', message: data.error || 'Failed to share project' });
        return;
      }
      setStatus({ type: 'success', message: 'Project shared! Members have inherited access to all contents.' });
      setEmail('');
      router.refresh();
    } catch {
      setStatus({ type: 'error', message: 'An unexpected error occurred' });
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Remove this person\'s access to the project?')) return;
    try {
      const res = await fetch(`/api/folders/${folderId}/share?userId=${userId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Failed to remove access');
        return;
      }
      router.refresh();
    } catch {
      alert('An unexpected error occurred');
    }
  };

  const handleRemoveTeam = async (removeTeamId: string) => {
    if (!confirm('Remove this team\'s access to the project?')) return;
    try {
      const res = await fetch(`/api/folders/${folderId}/share-team?teamId=${removeTeamId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Failed to remove access');
        return;
      }
      router.refresh();
    } catch {
      alert('An unexpected error occurred');
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 transition-all shadow-2xs hover:border-slate-300 cursor-pointer active:scale-95"
      >
        <Share2 className="w-3.5 h-3.5 text-indigo-600" />
        <span>Share Project</span>
      </button>

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto border border-slate-200/90 my-auto animate-slide-up">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Share Project Workspace</h2>
                <p className="text-xs text-slate-500 truncate max-w-xs">&quot;{folderName}&quot;</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 my-3 leading-relaxed">
              Sharing grants access to all documents and subfolders nested within this project.
            </p>

            {(sharedUsers.length > 0 || sharedTeams.length > 0) && (
              <div className="mb-5">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Active Collaborators
                </h3>
                <div className="border border-slate-200/80 rounded-xl divide-y divide-slate-100 max-h-40 overflow-y-auto">
                  {sharedTeams.map((t) => (
                    <div key={t.teamId} className="flex items-center justify-between px-3.5 py-2 text-xs">
                      <span className="flex items-center gap-2 text-slate-800 font-medium">
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{t.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal">(Team)</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.2 rounded bg-indigo-50 text-indigo-600">
                          {t.accessLevel}
                        </span>
                        <button
                          onClick={() => handleRemoveTeam(t.teamId)}
                          className="p-1 text-slate-300 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Remove team access"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {sharedUsers.map((u) => (
                    <div key={u.userId} className="flex items-center justify-between px-3.5 py-2 text-xs">
                      <span className="flex items-center gap-2 text-slate-800 font-medium">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span>{u.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal truncate max-w-[120px]">({u.email})</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.2 rounded bg-indigo-50 text-indigo-600">
                          {u.accessLevel}
                        </span>
                        <button
                          onClick={() => handleRemoveUser(u.userId)}
                          className="p-1 text-slate-300 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Remove access"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Segmented Mode Selector */}
            <div className="flex p-1 bg-slate-100 rounded-xl mb-4 border border-slate-200/80">
              <button
                type="button"
                onClick={() => setMode('person')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === 'person' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Add Person
              </button>
              <button
                type="button"
                onClick={() => setMode('team')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === 'team' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Add Team
              </button>
            </div>

            <form onSubmit={handleShare} className="space-y-4">
              {mode === 'person' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">User Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="teammate@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-slate-400"
                    />
                  </div>
                </div>
              ) : availableTeams.length === 0 ? (
                <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  No other teams available to share with. Create or join teams from the Teams page.
                </p>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Team</label>
                  <select
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  >
                    {availableTeams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Permission Level</label>
                <div className="relative">
                  <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={accessLevel}
                    onChange={(e) => setAccessLevel(e.target.value as 'VIEWER' | 'EDITOR')}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  >
                    <option value="VIEWER">Viewer (Read-only access to all files)</option>
                    <option value="EDITOR">Editor (Can create, edit, and organize files)</option>
                  </select>
                </div>
              </div>

              {status.message && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 animate-fade-in ${
                    status.type === 'error'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : status.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}
                >
                  {status.type === 'error' && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                  {status.type === 'success' && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                  {status.type === 'loading' && <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />}
                  <span>{status.message}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Done
                </button>
                <button
                  type="submit"
                  disabled={status.type === 'loading' || (mode === 'team' && availableTeams.length === 0)}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
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
      )}
    </>
  );
}
