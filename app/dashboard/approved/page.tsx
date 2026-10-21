import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import DocumentListCard from "@/components/DocumentListCard";
import { BadgeCheck } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function ApprovedDocumentsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id;

  const documents = await prisma.document.findMany({
    where: {
      status: 'APPROVED',
      deletedAt: null,
      OR: [{ ownerId: userId }, { sharedAccess: { some: { userId } } }],
    },
    orderBy: { updatedAt: 'desc' },
    include: { stars: { where: { userId } }, owner: true },
  });

  const items = documents.map((doc) => ({
    id: doc.id,
    title: doc.title,
    status: doc.status,
    updatedAt: doc.updatedAt.toISOString(),
    isStarred: doc.stars.length > 0,
    ownerName: doc.ownerId === userId ? undefined : doc.owner.name || doc.owner.email,
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <BadgeCheck className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Approved Documents</h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
              {items.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Documents that have been reviewed and approved across your workspaces.
          </p>
        </div>
      </div>
      <DocumentListCard
        documents={items}
        variant="approved"
        emptyMessage="No approved documents yet."
      />
    </div>
  );
}
