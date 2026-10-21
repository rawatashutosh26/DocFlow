import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import AccessRequestList, { AccessRequestItem } from "@/components/AccessRequestList";
import { KeyRound } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AccessRequestsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id;

  const [receivedRaw, sentRaw] = await Promise.all([
    prisma.accessRequest.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
      include: { document: true, folder: true, requester: true },
    }),
    prisma.accessRequest.findMany({
      where: { requesterId: userId },
      orderBy: { createdAt: 'desc' },
      include: { document: true, folder: true, owner: true },
    }),
  ]);

  const toItem = (r: (typeof receivedRaw)[number] | (typeof sentRaw)[number], counterpartyName: string): AccessRequestItem => ({
    id: r.id,
    resourceType: r.documentId ? 'document' : 'folder',
    resourceId: r.documentId || r.folderId || '',
    resourceName: r.document?.title || r.folder?.name || 'Unknown',
    requestedLevel: r.requestedLevel,
    status: r.status,
    message: r.message,
    createdAt: r.createdAt.toISOString(),
    counterpartyName,
  });

  const received: AccessRequestItem[] = receivedRaw.map((r) =>
    toItem(r, r.requester.name || r.requester.email || 'Someone')
  );
  const sent: AccessRequestItem[] = sentRaw.map((r) =>
    toItem(r, r.owner.name || r.owner.email || 'Someone')
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <KeyRound className="w-4 h-4" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Access Management & Requests</h1>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
            {received.length + sent.length} total
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Review incoming requests to access your documents and projects, or monitor requests you have sent to others.
        </p>
      </div>
      <AccessRequestList received={received} sent={sent} />
    </div>
  );
}
