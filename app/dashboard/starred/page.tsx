import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import DocumentListCard from "@/components/DocumentListCard";
import { Star } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function StarredPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id;

  const stars = await prisma.star.findMany({
    where: { userId, document: { deletedAt: null } },
    orderBy: { createdAt: 'desc' },
    include: { document: { include: { owner: true } } },
  });

  const items = stars.map(({ document: doc }) => ({
    id: doc.id,
    title: doc.title,
    status: doc.status,
    updatedAt: doc.updatedAt.toISOString(),
    isStarred: true,
    ownerName: doc.ownerId === userId ? undefined : doc.owner.name || doc.owner.email,
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center font-bold">
              <Star className="w-4 h-4 fill-amber-500" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Starred Documents</h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
              {items.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Documents you have pinned for instant access.
          </p>
        </div>
      </div>
      <DocumentListCard
        documents={items}
        variant="starred"
        emptyMessage="You haven't starred anything yet. Star a document from any list or editor to pin it here."
      />
    </div>
  );
}