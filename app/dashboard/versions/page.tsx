import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import VersionHistoryList, { VersionItem } from "@/components/VersionHistoryList";
import { History } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function VersionsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id;

  const versions = await prisma.documentVersion.findMany({
    where: {
      document: {
        deletedAt: null,
        OR: [{ ownerId: userId }, { sharedAccess: { some: { userId } } }],
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { document: true, createdBy: true },
  });

  const items: VersionItem[] = versions.map((v) => ({
    id: v.id,
    documentId: v.documentId,
    documentTitle: v.document.title,
    version: v.version,
    createdAt: v.createdAt.toISOString(),
    createdByName: v.createdBy.name || v.createdBy.email || 'Unknown',
    kind: v.content !== null ? 'content' : 'file',
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <History className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Version Snapshots</h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
              {items.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Global version history checkpoints across all accessible documents. Restore any past snapshot anytime.
          </p>
        </div>
      </div>
      <VersionHistoryList versions={items} />
    </div>
  );
}