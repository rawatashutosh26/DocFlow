"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, FileText, FolderOpen, User, Lock, Users, Sparkles, Folder } from 'lucide-react';
import RequestAccessButton from '@/components/RequestAccessButton';

interface DocResult {
  id: string;
  title: string;
  description: string | null;
  ownerName: string | null;
  projectName: string | null;
  hasAccess: boolean;
  hasPendingRequest: boolean;
  accessLevel: string | null;
}

interface ProjectResult {
  id: string;
  name: string;
  description: string | null;
  ownerName: string | null;
  teamName: string | null;
  documentCount: number;
  isLocked: boolean;
  hasAccess: boolean;
  hasPendingRequest: boolean;
  accessLevel: string | null;
  accessSource: string | null;
}

export default function SearchDocumentsPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DocResult[]>([]);
  const [projectResults, setProjectResults] = useState<ProjectResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setProjectResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search/documents?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json().catch(() => ({ results: [], projectResults: [] }));
      setResults(data.results || []);
      setProjectResults(data.projectResults || []);
    } catch {
      setResults([]);
      setProjectResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => runSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  const noResults = results.length === 0 && projectResults.length === 0;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Search className="w-4 h-4" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Global Knowledge Search</h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Search across every document and workspace in the company by keyword or description.
        </p>
      </div>

      {/* Prominent Search Input Box */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search documents, project names, technical specifications..."
          className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200/90 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 px-2 py-0.5 rounded-md hover:bg-slate-100 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {loading && (
        <div className="py-12 text-center text-xs font-semibold text-zinc-400 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-zinc-800 animate-ping" />
          <span>Searching documents...</span>
        </div>
      )}

      {!loading && searched && noResults && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-slate-400 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <p className="font-semibold text-slate-700 text-sm">No results found for &quot;{query}&quot;</p>
          <p className="text-xs text-slate-400 mt-1">Try searching with broader keywords or checking spelling.</p>
        </div>
      )}

      {!loading && !searched && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-slate-400 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <p className="font-semibold text-slate-700 text-sm">Instant Company-Wide Discovery</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Type at least 2 characters to discover documents and projects. You can request access to locked or private assets immediately.
          </p>
        </div>
      )}

      {/* Projects Results */}
      {!loading && projectResults.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 px-1">
            <FolderOpen className="w-3.5 h-3.5 text-indigo-500" />
            <span>Matching Projects ({projectResults.length})</span>
          </h2>
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {projectResults.map((proj) => (
              <div key={proj.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4.5 h-4.5 text-indigo-500 flex-shrink-0" />
                    {proj.hasAccess ? (
                      <Link
                        href={`/dashboard/folders/${proj.id}`}
                        className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                      >
                        {proj.name}
                      </Link>
                    ) : (
                      <span className="text-sm font-bold text-slate-900">{proj.name}</span>
                    )}
                    {proj.isLocked && (
                      <span className="p-0.5 rounded bg-amber-50 text-amber-600" title="Locked project">
                        <Lock className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  {proj.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{proj.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                    {proj.ownerName && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> {proj.ownerName}
                      </span>
                    )}
                    {proj.teamName && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {proj.teamName}
                      </span>
                    )}
                    <span>{proj.documentCount} file{proj.documentCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {proj.hasAccess ? (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                      {proj.accessLevel === 'OWNER' ? 'You own this' : (proj.accessSource === 'PROJECT_TEAM' || proj.accessSource === 'PROJECT_TEAM_SHARE') ? 'Team access' : `${proj.accessLevel} access`}
                    </span>
                  ) : proj.isLocked ? (
                    <RequestAccessButton
                      folderId={proj.id}
                      disabled={proj.hasPendingRequest}
                      disabledLabel="Request pending"
                    />
                  ) : (
                    <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">Private</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents Results */}
      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 px-1">
            <FileText className="w-3.5 h-3.5 text-indigo-500" />
            <span>Matching Documents ({results.length})</span>
          </h2>
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {results.map((doc) => (
              <div key={doc.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4.5 h-4.5 text-indigo-500 flex-shrink-0" />
                    {doc.hasAccess ? (
                      <Link
                        href={`/dashboard/files/${doc.id}`}
                        className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                      >
                        {doc.title}
                      </Link>
                    ) : (
                      <span className="text-sm font-bold text-slate-900">{doc.title}</span>
                    )}
                  </div>
                  {doc.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{doc.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                    {doc.ownerName && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> {doc.ownerName}
                      </span>
                    )}
                    {doc.projectName && (
                      <span className="flex items-center gap-1">
                        <FolderOpen className="w-3 h-3" /> {doc.projectName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {doc.hasAccess ? (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                      {doc.accessLevel === 'OWNER' ? 'You own this' : `${doc.accessLevel} access`}
                    </span>
                  ) : (
                    <RequestAccessButton
                      documentId={doc.id}
                      disabled={doc.hasPendingRequest}
                      disabledLabel="Request pending"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}