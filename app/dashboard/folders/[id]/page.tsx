import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Users, Lock, Folder, FolderTree, ShieldAlert } from "lucide-react";
import CreateFolderButton from "@/components/CreateFolderButton";
import CreateDocumentButton from "@/components/CreateDocumentButton";
import FileListTable from "@/components/FileListTable";
import FolderLockToggle from "@/components/FolderLockToggle";
import AssignTeamControl from "@/components/AssignTeamControl";
import type { TeamOption } from "@/components/AssignTeamControl";
import RequestAccessButton from "@/components/RequestAccessButton";
import ProjectShareModal from "@/components/ProjectShareModal";
import { resolveFolderAccess } from "@/lib/access";

export const dynamic = 'force-dynamic';

async function getBreadcrumb(folderId: string) {
  const trail = [];
  let currentId: string | null = folderId;
  while (currentId) {
    const folder: { id: string; name: string; parentId: string | null } | null =
      await prisma.folder.findUnique({
        where: { id: currentId },
        select: { id: true, name: true, parentId: true },
      });
    if (!folder) break;
    trail.unshift(folder);
    currentId = folder.parentId;
  }
  return trail;
}

export default async function FolderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id;
  const { id: folderId } = await params;

  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    include: {
      children: { orderBy: { name: 'asc' } },
      documents: {
        where: { deletedAt: null },
        orderBy: { updatedAt: 'desc' },
      },
      team: {
        include: { members: { where: { userId } } },
      },
      grantedAccess: { where: { userId } },
      teamAccess: {
        include: { team: { include: { members: { where: { userId } } } } },
      },
      accessRequests: { where: { requesterId: userId, status: 'PENDING' } },
    },
  });

  if (!folder) {
    notFound();
  }

  const access = resolveFolderAccess(userId, folder);
  const isOwner = access.isOwner;
  const hasAccess = access.hasAccess;

  if (!hasAccess && !folder.isLocked) {
    notFound();
  }

  if (!hasAccess && folder.isLocked) {
    const hasPendingRequest = folder.accessRequests.length > 0;
    return (
      <div className="max-w-md mx-auto text-center py-20 animate-fade-in">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl p-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-100 shadow-xs">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">{folder.name}</h1>
          {folder.description && (
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">{folder.description}</p>
          )}
          {folder.team && (
            <p className="text-xs text-indigo-600 font-medium mt-2 flex items-center justify-center gap-1">
              <Users className="w-3.5 h-3.5" /> Owned by team &quot;{folder.team.name}&quot;
            </p>
          )}
          <p className="text-xs text-slate-500 mt-4 mb-6">
            This project is locked by its owner. Request access to view and collaborate on its files.
          </p>
          <div className="flex justify-center">
            <RequestAccessButton
              folderId={folder.id}
              disabled={hasPendingRequest}
              disabledLabel="Request pending"
            />
          </div>
        </div>
      </div>
    );
  }

  const canEdit = access.canEdit;
  const breadcrumb = await getBreadcrumb(folderId);

  const myTeams: TeamOption[] = isOwner
    ? (
        await prisma.teamMembership.findMany({
          where: { userId },
          include: { team: true },
          orderBy: { team: { name: 'asc' } },
        })
      ).map((m) => ({ id: m.team.id, name: m.team.name }))
    : [];

  let sharedUsers: { userId: string; name: string; email: string; accessLevel: 'VIEWER' | 'EDITOR' }[] = [];
  let sharedTeams: { teamId: string; name: string; accessLevel: 'VIEWER' | 'EDITOR' }[] = [];
  if (isOwner) {
    const [accessRows, teamAccessRows] = await Promise.all([
      prisma.folderAccess.findMany({ where: { folderId }, include: { user: true } }),
      prisma.folderTeamAccess.findMany({ where: { folderId }, include: { team: true } }),
    ]);
    sharedUsers = accessRows.map((r) => ({
      userId: r.userId,
      name: r.user.name || 'Unnamed',
      email: r.user.email || '',
      accessLevel: r.accessLevel,
    }));
    sharedTeams = teamAccessRows.map((r) => ({
      teamId: r.teamId,
      name: r.team.name,
      accessLevel: r.accessLevel,
    }));
  }
  const availableTeams = myTeams.filter((t) => t.id !== folder.teamId);

  const formattedDocuments = folder.documents.map((doc) => ({
    id: doc.id,
    title: doc.title,
    size: doc.size,
    updatedAt: doc.updatedAt.toISOString(),
    version: doc.version,
    isLocked: doc.isLocked,
    lockedById: doc.lockedById,
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Breadcrumb Bar */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap bg-white/70 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-slate-200/80 w-fit">
        <Link href="/dashboard/projects" className="hover:text-indigo-600 font-medium transition-colors">
          Projects
        </Link>
        {breadcrumb.map((crumb) => (
          <span key={crumb.id} className="flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link
              href={`/dashboard/folders/${crumb.id}`}
              className={crumb.id === folderId ? "text-slate-900 font-bold" : "hover:text-indigo-600 font-medium transition-colors"}
            >
              {crumb.name}
            </Link>
          </span>
        ))}
      </nav>

      {/* Project Header and Actions */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Folder className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>{folder.name}</span>
              {folder.isLocked && (
                <span className="p-1 rounded-md bg-amber-50 text-amber-600 border border-amber-200" title="Project is locked">
                  <Lock className="w-3.5 h-3.5" />
                </span>
              )}
            </h1>
          </div>
          {folder.description && (
            <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">{folder.description}</p>
          )}
          <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-2">
            <span>{folder.children.length} subfolders</span>
            <span>·</span>
            <span>{folder.documents.length} files</span>
            {folder.team && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  <Users className="w-3 h-3" /> {folder.team.name}
                </span>
              </>
            )}
          </p>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2.5">
            <CreateFolderButton parentId={folder.id} />
            <CreateDocumentButton folderId={folder.id} />
          </div>
        )}
      </div>

      {/* Owner Control Bar */}
      {isOwner && (
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex-wrap">
          <FolderLockToggle folderId={folder.id} isLocked={folder.isLocked} />
          <AssignTeamControl folderId={folder.id} currentTeamId={folder.teamId} teams={myTeams} />
          <ProjectShareModal
            folderId={folder.id}
            folderName={folder.name}
            availableTeams={availableTeams}
            sharedUsers={sharedUsers}
            sharedTeams={sharedTeams}
          />
        </div>
      )}

      {/* Subfolders Grid */}
      {folder.children.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <FolderTree className="w-3.5 h-3.5 text-indigo-500" />
            <span>Subfolders</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {folder.children.map((sub) => (
              <Link
                key={sub.id}
                href={`/dashboard/folders/${sub.id}`}
                className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-sm hover:border-indigo-300 transition-all flex items-center gap-3 group hover:-translate-y-0.5"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600 group-hover:scale-105 transition-transform">
                  <Folder className="w-4.5 h-4.5" />
                </div>
                <span className="font-semibold text-xs text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                  {sub.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Documents Inside Folder */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Documents
        </h2>
        <FileListTable documents={formattedDocuments} currentUserId={userId} />
      </div>
    </div>
  );
}