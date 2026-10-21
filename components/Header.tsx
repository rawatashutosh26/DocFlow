"use client";

import { Search, Settings2, FolderPlus, User, LogOut, Check, Sun, Moon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import UploadButton from './UploadButton';
import { ALL_COLUMNS, useColumnPreferences } from './ColumnPreferencesProvider';
import { useTheme } from './ThemeProvider';

interface HeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    id?: string;
  };
}

export default function Header({ user }: HeaderProps) {
  const ownerId = user?.id || "no-user-found";
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isColumnsOpen, setIsColumnsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const columnsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const { isVisible, toggleColumn } = useColumnPreferences();
  const { isLight, toggleTheme } = useTheme();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (columnsRef.current && !columnsRef.current.contains(e.target as Node)) {
        setIsColumnsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateFolder = async () => {
    const name = window.prompt("New folder name:");
    if (!name || !name.trim()) return;

    try {
      const res = await fetch('/api/folders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to create folder');
      } else {
        router.refresh();
      }
    } catch {
      alert('An unexpected error occurred while creating the folder');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/dashboard/files?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6 flex-shrink-0 z-30 sticky top-0 transition-colors">
      {/* Left Quick Navigation Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleCreateFolder}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-800 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 transition-colors cursor-pointer shadow-xs"
          title="Create a new folder"
        >
          <FolderPlus className={`w-4 h-4 ${isLight ? 'text-amber-500 fill-amber-100/50' : 'text-zinc-600'}`} />
          <span>New Folder</span>
        </button>

        <div className="relative" ref={columnsRef}>
          <button
            onClick={() => setIsColumnsOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-800 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 transition-colors cursor-pointer shadow-xs"
            title="Configure visible columns"
          >
            <Settings2 className={`w-4 h-4 ${isLight ? 'text-amber-500' : 'text-zinc-500'}`} />
            <span>Columns</span>
          </button>

          {isColumnsOpen && (
            <div className="absolute left-0 top-full mt-2 w-52 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 py-1.5 animate-slide-up">
              <p className="px-3.5 py-1 text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Visible Columns
              </p>
              <div className="mt-1 divide-y divide-zinc-100">
                {ALL_COLUMNS.map((col) => (
                  <button
                    key={col.key}
                    onClick={() => toggleColumn(col.key)}
                    className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer text-left"
                  >
                    <span>{col.label}</span>
                    {isVisible(col.key) && (
                      <span className="w-4 h-4 rounded-full bg-zinc-100 text-zinc-800 flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Search and Primary Actions */}
      <div className="flex items-center gap-3">
        <UploadButton ownerId={ownerId} />

        <form onSubmit={handleSearch} className="relative">
          <input 
            type="text" 
            placeholder="Search documents, tags..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-56 lg:w-68 pl-8 pr-12 py-1.5 bg-zinc-50 hover:bg-white focus:bg-white border border-zinc-200 rounded-lg text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-colors shadow-xs"
          />
          <Search className={`w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${isLight ? 'text-amber-500' : 'text-zinc-400'}`} />
          <button
            type="submit"
            className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-50 rounded-md text-[10px] font-medium cursor-pointer transition-colors"
          >
            Go
          </button>
        </form>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-xs font-medium text-zinc-800 transition-all cursor-pointer shadow-xs"
          title={isLight ? 'Switch to Dark Mode (Original look)' : 'Switch to Light Mode'}
          aria-label="Toggle theme"
        >
          {isLight ? (
            <>
              <Moon className="w-4 h-4 text-zinc-700" />
              <span className="hidden sm:inline text-[11px]">Dark Mode</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-amber-500" />
              <span className="hidden sm:inline text-[11px]">Light Mode</span>
            </>
          )}
        </button>

        {/* User Profile Avatar and Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen((v) => !v)}
            className="w-8 h-8 rounded-lg bg-zinc-900 text-zinc-50 flex items-center justify-center font-medium text-xs hover:bg-zinc-800 transition-colors cursor-pointer"
            title={user?.email || "User Profile"}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 p-1.5 animate-slide-up">
              <div className="px-3 py-2 bg-zinc-50 rounded-md mb-1 border border-zinc-100">
                <p className="text-xs font-semibold text-zinc-900 truncate">{user?.name || "User"}</p>
                <p className="text-[11px] text-zinc-500 truncate mt-0.5">{user?.email}</p>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 rounded-md transition-colors cursor-pointer mb-1"
              >
                <span className="flex items-center gap-2">
                  {isLight ? <Moon className="w-3.5 h-3.5 text-zinc-600" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                  <span>{isLight ? 'Dark Mode' : 'Light Mode'}</span>
                </span>
                <span className="text-[10px] uppercase font-bold text-zinc-400">
                  {isLight ? 'Light' : 'Dark'}
                </span>
              </button>

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
