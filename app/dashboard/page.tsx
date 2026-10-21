import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Link from 'next/link';
import { FileText, Clock3, BadgeCheck, HardDrive, Activity, ArrowRight, Sparkles, FolderOpen, ShieldCheck } from 'lucide-react';
import QuickActions from '@/components/QuickActions';

export const dynamic = 'force-dynamic';

export default async function DashboardOverviewPage() {
  const session = await getServerSession(authOptions);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session?.user as any)?.id;
  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'User';

  const [
    totalDocs,
    pendingDocs,
    approvedDocs,
    sizeAggregation,
    recentDocs
  ] = await Promise.all([
    prisma.document.count({ where: { deletedAt: null } }),
    prisma.document.count({ where: { status: 'PENDING', deletedAt: null } }),
    prisma.document.count({ where: { status: 'APPROVED', deletedAt: null } }),
    prisma.document.aggregate({ where: { deletedAt: null }, _sum: { size: true } }),
    prisma.document.findMany({
      take: 5,
      where: { deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      include: { owner: true } 
    })
  ]);

  const formatBytes = (bytes: number | null) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalStorage = formatBytes(sizeAggregation._sum.size);

  const stats = [
    { 
      name: 'Total Documents', 
      value: totalDocs.toString(), 
      icon: FileText, 
      color: 'text-zinc-700', 
      bg: 'bg-zinc-100', 
      description: 'Active managed files'
    },
    { 
      name: 'Pending Review', 
      value: pendingDocs.toString(), 
      icon: Clock3, 
      color: 'text-amber-700', 
      bg: 'bg-amber-50', 
      description: 'Awaiting reviewer action'
    },
    { 
      name: 'Approved Documents', 
      value: approvedDocs.toString(), 
      icon: BadgeCheck, 
      color: 'text-emerald-700', 
      bg: 'bg-emerald-50', 
      description: 'Authorized and published'
    },
    { 
      name: 'Storage Pool', 
      value: totalStorage, 
      icon: HardDrive, 
      color: 'text-zinc-700', 
      bg: 'bg-zinc-100', 
      description: 'PostgreSQL storage consumed'
    },
  ];

  const formatTimeAgo = (date: Date) => {
    const diffMs = new Date().getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Workspace Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-zinc-100 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-medium tracking-wide uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                Workspace
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
              Welcome back, {userName}
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl">
              Overview of your documents, pending review queues, and storage usage.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard/files"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700/60 transition-colors shadow-xs"
            >
              <FolderOpen className="w-4 h-4 text-zinc-400" />
              <span>Browse Documents</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Stat Metric Cards (Shadcn UI style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div 
            key={stat.name} 
            className="bg-white rounded-xl border border-zinc-200 p-5 shadow-xs transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{stat.name}</p>
                <p className="text-2xl font-bold text-zinc-900 mt-1.5 tracking-tight">{stat.value}</p>
                <p className="text-[11px] text-zinc-400 mt-1">{stat.description}</p>
              </div>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.bg} flex-shrink-0`}>
                <stat.icon className={`w-4.5 h-4.5 ${stat.color} theme-icon`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid: Recent Activity + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Uploads Feed */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <h3 className="text-xs font-semibold text-zinc-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-zinc-600 theme-icon" />
              <span>Recent Activity & Updates</span>
            </h3>
            <Link 
              href="/dashboard/recent" 
              className="text-xs text-zinc-600 font-medium hover:text-zinc-900 flex items-center gap-1 group"
            >
              <span>Full log</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="divide-y divide-zinc-100">
            {recentDocs.length === 0 ? (
              <div className="px-6 py-12 text-center text-zinc-400 text-xs">
                No recent activity found. Upload or create your first document!
              </div>
            ) : (
              recentDocs.map((doc) => (
                <div key={doc.id} className="px-5 py-3.5 hover:bg-zinc-50/60 transition-colors flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 border border-zinc-200/80 flex items-center justify-center flex-shrink-0 text-zinc-700 font-medium text-xs">
                      <FileText className="w-4 h-4 text-zinc-600 theme-icon" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 truncate">
                        <Link href={`/dashboard/files/${doc.id}`} className="hover:underline">
                          {doc.title}
                        </Link>
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        By <span className="font-medium text-zinc-600">{doc.owner.name || doc.owner.email}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[11px] text-zinc-400">
                      {formatTimeAgo(doc.updatedAt)}
                    </span>
                    <Link
                      href={`/dashboard/files/${doc.id}`}
                      className="px-2.5 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium transition-colors"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Quick Actions & Status */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xs p-5">
            <h3 className="text-xs font-semibold text-zinc-900 mb-1">Quick Actions</h3>
            <p className="text-[11px] text-zinc-400 mb-3.5">Standard document management workflows.</p>
            <div className="space-y-2">
              <QuickActions ownerId={userId || ''} pendingCount={pendingDocs} />
            </div>
          </div>

          <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-4">
            <div className="flex items-center gap-2 text-zinc-800 font-semibold text-xs mb-1.5">
              <ShieldCheck className="w-4 h-4 text-zinc-600 theme-icon" />
              <span>Document Security</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Document checkouts prevent overwrite conflicts. All document edits, downloads, and shares are logged to the audit history.
            </p>
          </div>
        </div>
        
      </div>
    </div>
  );
}