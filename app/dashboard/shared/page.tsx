import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";
import FileListTable from "@/components/FileListTable";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, FileText, FolderTree, Folder } from "lucide-react";

export default async function SharedFilesPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id;

  const myTeamIds = (
    await prisma.teamMembership.findMany({ where: { userId }, select: { teamId: true } })
  ).map((m) => m.teamId);

  const sharedProjects = await prisma.folder.findMany({
    where: {
      ownerId: { not: userId },
      OR: [
        { teamId: { in: myTeamIds } },
        { grantedAccess: { some: { userId } } },
        { teamAccess: { some: { teamId: { in: myTeamIds } } } },
      ],
    },
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { documents: true, children: true } } },
  });

  const sharedDocuments = await prisma.document.findMany({
    where: {
      deletedAt: null,
      ownerId: { not: userId },
      OR: [
        { sharedAccess: { some: { userId } } },
        { folder: { teamId: { in: myTeamIds } } },
        { folder: { grantedAccess: { some: { userId } } } },
        { folder: { teamAccess: { some: { teamId: { in: myTeamIds } } } } },
      ],
    },
    orderBy: { updatedAt: 'desc' },
    include: { stars: { where: { userId } } },
  }).then((docs) =>
    docs.map((doc) => ({
      id: doc.id,
      title: doc.title,
      size: doc.size,
      updatedAt: doc.updatedAt.toISOString(),
      version: doc.version,
      isLocked: doc.isLocked,
      lockedById: doc.lockedById,
      status: doc.status,
      isStarred: doc.stars.length > 0,
      ownerId: doc.ownerId,
    }))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Shared With Me</h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
              {sharedProjects.length + sharedDocuments.length} items
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Projects and documents shared with you directly or via your team memberships.
          </p>
        </div>
      </div>

      {sharedProjects.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Folder className="w-3.5 h-3.5 text-indigo-500" />
            <span>Shared Projects & Folders</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sharedProjects.map((folder) => (
              <Link
                key={folder.id}
                href={`/dashboard/folders/${folder.id}`}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all group hover:-translate-y-0.5"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Folder className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                  {folder.name}
                </h3>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> {folder._count.documents} files
                  </span>
                  <span className="flex items-center gap-1">
                    <FolderTree className="w-3.5 h-3.5" /> {folder._count.children} subfolders
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-indigo-500" />
          <span>Shared Documents</span>
        </h2>
        {sharedDocuments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-slate-400 shadow-xs">
            No individual documents have been directly shared with you yet.
          </div>
        ) : (
          <FileListTable documents={sharedDocuments} currentUserId={userId} />
        )}
      </div>
    </div>
  );
}
