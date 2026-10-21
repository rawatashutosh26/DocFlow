"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard,
  Folder, 
  Clock3, 
  BadgeCheck, 
  FileWarning, 
  Users, 
  Briefcase, 
  History, 
  GitBranch, 
  ScrollText, 
  Star, 
  Clock, 
  Trash2, 
  Plus, 
  ChevronDown, 
  Search, 
  KeyRound, 
  UsersRound, 
  FileText 
} from 'lucide-react';
import { useTheme } from './ThemeProvider';

const sidebarGroups = [
  {
    category: "Workspace",
    items: [
      { name: 'Overview', icon: LayoutDashboard, href: '/dashboard' },
      { name: 'My Files', icon: Folder, href: '/dashboard/files' },
      { name: 'Shared with me', icon: Users, href: '/dashboard/shared' },
      { name: 'Projects', icon: Briefcase, href: '/dashboard/projects' },
      { name: 'Search Documents', icon: Search, href: '/dashboard/search' },
    ]
  },
  {
    category: "Workflow",
    items: [
      { name: 'Pending Approval', icon: Clock3, href: '/dashboard/pending-approval' },
      { name: 'Approved Documents', icon: BadgeCheck, href: '/dashboard/approved' },
      { name: 'Needs Changes', icon: FileWarning, href: '/dashboard/rejected' },
      { name: 'Requests', icon: GitBranch, href: '/dashboard/requests', badgeKey: 'pendingReviewsCount' },
      { name: 'Access Requests', icon: KeyRound, href: '/dashboard/access-requests', badgeKey: 'pendingAccessRequestsCount' },
    ]
  },
  {
    category: "Company",
    items: [
      { name: 'Teams', icon: UsersRound, href: '/dashboard/teams' },
    ]
  },
  {
    category: "System & Audit",
    items: [
      { name: 'Version History', icon: History, href: '/dashboard/versions' },
      { name: 'Audit Log', icon: ScrollText, href: '/dashboard/audit' },
    ]
  },
  {
    category: "Quick Access",
    items: [
      { name: 'Starred', icon: Star, href: '/dashboard/starred' },
      { name: 'Recent', icon: Clock, href: '/dashboard/recent' },
      { name: 'Trash', icon: Trash2, href: '/dashboard/trash' },
    ]
  }
];

interface SidebarProps {
  pendingReviewsCount?: number;
  pendingAccessRequestsCount?: number;
}

export default function Sidebar({ pendingReviewsCount = 0, pendingAccessRequestsCount = 0 }: SidebarProps) {
  const { isLight } = useTheme();

  const badgeCounts: Record<string, number> = {
    pendingReviewsCount,
    pendingAccessRequestsCount,
  };

  const pathname = usePathname();
  const router = useRouter();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Workspace": true,
    "Workflow": true,
    "Company": true,
    "System & Audit": true,
    "Quick Access": true,
  });

  const toggleGroup = (category: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleNewWorkspace = async () => {
    const name = window.prompt("Name your new workspace/project:");
    if (!name || !name.trim()) return;

    try {
      const res = await fetch('/api/folders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to create workspace');
        return;
      }
      router.push(`/dashboard/folders/${data.folder.id}`);
      router.refresh();
    } catch {
      alert('An unexpected error occurred while creating the workspace');
    }
  };

  return (
    <aside 
      className={`w-64 h-full flex flex-col flex-shrink-0 select-none transition-colors duration-150 ${
        isLight
          ? 'bg-white border-r border-zinc-200 text-zinc-700'
          : 'bg-zinc-950 border-r border-zinc-800/80 text-zinc-300'
      }`}
    >
      {/* Brand Header */}
      <div 
        className={`h-16 flex items-center justify-between px-5 flex-shrink-0 border-b ${
          isLight
            ? 'bg-white border-zinc-200'
            : 'bg-zinc-950 border-zinc-800/80'
        }`}
      >
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div 
            className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-xs transition-colors ${
              isLight
                ? 'bg-amber-500 text-white'
                : 'bg-zinc-100 text-zinc-950'
            }`}
          >
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span 
              className={`text-sm font-semibold tracking-tight ${
                isLight ? 'text-zinc-900 font-bold' : 'text-zinc-100'
              }`}
            >
              DocFlow
            </span>
            <p className={`text-[10px] ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
              Document Management
            </p>
          </div>
        </Link>
      </div>
      
      {/* Scrollable Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 custom-scrollbar">
        {sidebarGroups.map((group) => {
          const isOpen = openGroups[group.category];
          
          return (
            <div key={group.category} className="space-y-1">
              {/* Category Header */}
              <button 
                onClick={() => toggleGroup(group.category)}
                className={`w-full flex items-center justify-between px-3 py-1 text-[11px] font-medium uppercase tracking-wider transition-colors cursor-pointer group ${
                  isLight
                    ? 'text-zinc-400 hover:text-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>{group.category}</span>
                <ChevronDown 
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isLight 
                      ? 'text-zinc-400 group-hover:text-zinc-600' 
                      : 'text-zinc-400 group-hover:text-zinc-300'
                  } ${isOpen ? 'transform rotate-0' : 'transform -rotate-90'}`} 
                />
              </button>
              
              {/* Nav Items */}
              {isOpen && (
                <ul className="space-y-0.5 pt-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    const badgeCount = 'badgeKey' in item ? badgeCounts[item.badgeKey as string] : 0;

                    return (
                      <li key={item.name}>
                        <Link 
                          href={item.href}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                            isActive
                              ? isLight
                                ? 'bg-amber-50 text-amber-950 border border-amber-200/80 font-semibold shadow-xs'
                                : 'bg-zinc-800 text-zinc-50 shadow-xs'
                              : isLight
                                ? 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                          }`}
                        >
                          <span className="flex items-center gap-2.5 min-w-0">
                            {/* In Light Mode: yellow folder icon color! In Dark Mode: previous look */}
                            <item.icon 
                              className={`w-4 h-4 flex-shrink-0 transition-colors ${
                                isLight
                                  ? 'text-amber-500 fill-amber-100/40 group-hover:text-amber-600'
                                  : isActive 
                                    ? 'text-zinc-100' 
                                    : 'text-zinc-400 group-hover:text-zinc-300'
                              }`} 
                            />
                            <span className="truncate">{item.name}</span>
                          </span>

                          {badgeCount > 0 && (
                            <span className={`inline-flex items-center justify-center min-w-[1.25rem] h-4.5 px-1.5 rounded-full text-[10px] font-semibold ${
                              isActive
                                ? isLight
                                  ? 'bg-amber-200 text-amber-900'
                                  : 'bg-zinc-700 text-zinc-100'
                                : 'bg-rose-950 text-rose-300 border border-rose-900/80'
                            }`}>
                              {badgeCount}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Action Footer */}
      <div 
        className={`p-3 border-t space-y-2 ${
          isLight
            ? 'bg-white border-zinc-200'
            : 'bg-zinc-950 border-zinc-800/80'
        }`}
      >
        <button
          onClick={handleNewWorkspace}
          className={`flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg text-xs font-medium border transition-colors cursor-pointer shadow-xs group ${
            isLight
              ? 'bg-zinc-50 hover:bg-amber-50 text-zinc-800 hover:text-amber-950 border-zinc-200 hover:border-amber-200'
              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-zinc-100 border-zinc-800'
          }`}
        >
          <Plus className={`w-3.5 h-3.5 group-hover:scale-105 transition-transform ${isLight ? 'text-amber-500' : 'text-zinc-400'}`} />
          <span>New Workspace</span>
        </button>

        <div className="flex items-center justify-between px-2 py-1 text-[11px]">
          <span className={`flex items-center gap-1.5 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Storage Connected
          </span>
          <span className={`font-mono text-[10px] ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`}>v1.0</span>
        </div>
      </div>
    </aside>
  );
}