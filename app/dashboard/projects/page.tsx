import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Briefcase, FileText, FolderTree, Users, Share2, Folder } from "lucide-react";
import CreateFolderButton from "@/components/CreateFolderButton";

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id;

  const myTeamIds = (
    await prisma.teamMembership.findMany({ where: { userId }, select: { teamId: true } })
  ).map((m) => m.teamId);

  const folders = await prisma.folder.findMany({
    where: {
      parentId: null,
      OR: [
        { ownerId: userId },
        { teamId: { in: myTeamIds } },
        { grantedAccess: { some: { userId } } },
        { teamAccess: { some: { teamId: { in: myTeamIds } } } },
      ],
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { documents: true, children: true } },
    },
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Briefcase className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Projects & Workspaces</h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
              {folders.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Top-level organizational projects owned by you or shared across your company.
          </p>
        </div>
        <CreateFolderButton />
      </div>

      {folders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-16 text-center text-slate-400 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
            <Folder className="w-6 h-6" />
          </div>
          <p className="font-semibold text-slate-800 text-base">No projects created yet</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Create a top-level project folder to organize your files, set up team permissions, and collaborate securely.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {folders.map((folder) => {
            const isOwner = folder.ownerId === userId;
            return (
              <Link
                key={folder.id}
                href={`/dashboard/folders/${folder.id}`}
                className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all group hover:-translate-y-0.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600 shadow-2xs group-hover:scale-105 transition-transform">
                      <Folder className="w-5 h-5 text-indigo-600" />
                    </div>
                    {!isOwner ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                        <Share2 className="w-3 h-3" /> Shared
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        Owner
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                    {folder.name}
                  </h3>
                  {folder.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {folder.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 font-medium">
                    <FileText className="w-3.5 h-3.5 text-slate-400" /> {folder._count.documents} files
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <FolderTree className="w-3.5 h-3.5 text-slate-400" /> {folder._count.children} subfolders
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}