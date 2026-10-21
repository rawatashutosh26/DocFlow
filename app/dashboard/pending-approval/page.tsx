import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import DocumentListCard from "@/components/DocumentListCard";
import { Clock3 } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function PendingApprovalPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id;

  const documents = await prisma.document.findMany({
    where: { ownerId: userId, status: 'PENDING', deletedAt: null },
    orderBy: { updatedAt: 'desc' },
    include: { stars: { where: { userId } } },
  });

  const items = documents.map((doc) => ({
    id: doc.id,
    title: doc.title,
    status: doc.status,
    updatedAt: doc.updatedAt.toISOString(),
    isStarred: doc.stars.length > 0,
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock3 className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pending Approval</h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
              {items.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Documents you&apos;ve submitted that are currently under review by designated reviewers.
          </p>
        </div>
      </div>
      <DocumentListCard
        documents={items}
        variant="pending"
        emptyMessage="You have no documents currently awaiting approval."
      />
    </div>
  );
}