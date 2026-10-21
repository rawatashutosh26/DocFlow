import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";
import FileListTable from "@/components/FileListTable";
import { redirect } from "next/navigation";
import CreateDocumentButton from "@/components/CreateDocumentButton";
import Link from "next/link";
import { Folder, X } from "lucide-react";

export default async function FilesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id;
  const { q } = await searchParams;

  const myTeamIds = (
    await prisma.teamMembership.findMany({ where: { userId }, select: { teamId: true } })
  ).map((m) => m.teamId);

  const rawDocuments = await prisma.document.findMany({
    where: {
      AND: [
        {
          OR: [
            { ownerId: userId },
            { sharedAccess: { some: { userId: userId } } },
            { folder: { ownerId: userId } },
            { folder: { teamId: { in: myTeamIds } } },
            { folder: { grantedAccess: { some: { userId } } } },
            { folder: { teamAccess: { some: { teamId: { in: myTeamIds } } } } },
          ]
        },
        { deletedAt: null },
        q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {},
      ]
    },
    orderBy: { updatedAt: 'desc' },
    include: { stars: { where: { userId } } },
  });

  const formattedDocuments = rawDocuments.map((doc) => ({
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
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Folder className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Files</h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
              {formattedDocuments.length}
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-1">
            {q ? (
              <span className="inline-flex items-center gap-1.5 mt-1">
                <span>Filtering by query: </span>
                <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                  &quot;{q}&quot;
                </span>
                <Link href="/dashboard/files" className="text-indigo-600 hover:text-indigo-800 ml-1 inline-flex items-center gap-0.5 text-xs">
                  <X className="w-3 h-3" /> Clear
                </Link>
              </span>
            ) : (
              'Manage, check in/out, edit, and version all your documents.'
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <CreateDocumentButton />
        </div>
      </div>
      
      <FileListTable documents={formattedDocuments} currentUserId={userId} />
    </div>
  );
}
