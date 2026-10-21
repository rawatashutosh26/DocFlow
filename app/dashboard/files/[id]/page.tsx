import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import DocumentEditor from "@/components/DocumentEditor";
import DocumentHeaderActions from "@/components/DocumentHeaderActions";
import DocumentDescriptionEditor from "@/components/DocumentDescriptionEditor";
import VersionHistoryList, { VersionItem } from "@/components/VersionHistoryList";
import Link from "next/link";
import { ArrowLeft, RotateCcw, FileText, Download, ShieldCheck, HardDrive } from "lucide-react";
import { logAudit } from "@/lib/audit";
import { documentAccessInclude, resolveDocumentAccess } from "@/lib/access";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id;
  
  const resolvedParams = await params;
  const documentId = resolvedParams.id;

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      ...documentAccessInclude,
      stars: {
        where: { userId: userId }
      },
      versions: {
        orderBy: { createdAt: 'desc' },
        include: { createdBy: true },
      },
    }
  });

  if (!document) {
    return (
      <div className="max-w-md mx-auto py-20 text-center animate-fade-in">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Document Not Found</h1>
          <p className="text-xs text-slate-500 mt-1">The document you are looking for does not exist or was deleted.</p>
          <Link 
            href="/dashboard/files" 
            className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Files
          </Link>
        </div>
      </div>
    );
  }

  const access = resolveDocumentAccess(userId, document);
  const isOwner = access.isOwner;

  if (!access.hasAccess) {
    return (
      <div className="max-w-md mx-auto py-20 text-center animate-fade-in">
        <div className="bg-white rounded-2xl border border-rose-200 p-8 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Access Denied</h1>
          <p className="text-xs text-slate-500 mt-1">You do not have permission to view or edit this document.</p>
          <Link 
            href="/dashboard/files" 
            className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Files
          </Link>
        </div>
      </div>
    );
  }

  if (document.deletedAt) {
    if (!isOwner) {
      return (
        <div className="max-w-md mx-auto py-20 text-center animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <h1 className="text-xl font-bold text-slate-900">Document Not Found</h1>
            <Link href="/dashboard/files" className="mt-4 text-xs font-semibold text-indigo-600 hover:underline inline-block">
              Return to Files
            </Link>
          </div>
        </div>
      );
    }
    return (
      <div className="max-w-md mx-auto py-20 text-center animate-fade-in">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <RotateCcw className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">This document is in Trash</h1>
          <p className="text-xs text-slate-500 mt-1 mb-6 leading-relaxed">
            &quot;{document.title}&quot; was moved to trash. Restore it to view or continue editing.
          </p>
          <Link
            href="/dashboard/trash"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-xs font-semibold shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Go to Trash to Restore
          </Link>
        </div>
      </div>
    );
  }

  const isReadOnly = !access.canEdit;

  const versionItems: VersionItem[] = document.versions.map((v) => ({
    id: v.id,
    documentId: document.id,
    documentTitle: document.title,
    version: v.version,
    createdAt: v.createdAt.toISOString(),
    createdByName: v.createdBy.name || v.createdBy.email || 'Unknown',
    kind: v.content !== null ? 'content' : 'file',
  }));

  await logAudit({
    action: "DOCUMENT_VIEWED",
    userId,
    documentId,
    details: `Viewed "${document.title}"`,
  });

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6 animate-fade-in pb-12">
      {/* Header with Navigation and Actions */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div className="flex items-start gap-3">
          <Link 
            href="/dashboard/files" 
            className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all shadow-2xs cursor-pointer hover:scale-105 active:scale-95"
            title="Back to files"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{document.title}</h1>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                {document.type === 'NATIVE' ? 'Rich Text' : 'Binary File'}
              </span>
            </div>
            <DocumentDescriptionEditor
              documentId={document.id}
              initialDescription={document.description}
              canEdit={access.canEdit}
            />
          </div>
        </div>

        <DocumentHeaderActions
          documentId={document.id}
          documentTitle={document.title}
          status={document.status}
          isStarred={document.stars.length > 0}
          canSubmit={access.canEdit}
        />
      </div>

      {/* Main Body: Native Editor or File Media Preview */}
      {document.type === 'NATIVE' ? (
        <DocumentEditor 
          documentId={document.id} 
          documentTitle={document.title}
          initialContent={document.content || ""} 
          isReadOnly={isReadOnly} 
        />
      ) : (
        <div className="bg-white p-8 rounded-2xl border border-slate-200/90 shadow-xs">
          {document.mimeType?.startsWith('audio/') && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6">
              <audio controls className="w-full">
                <source src={`/api/files/${document.id}`} type={document.mimeType} />
                Your browser does not support audio playback.
              </audio>
            </div>
          )}
          {document.mimeType?.startsWith('video/') && (
            <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 mb-6 max-h-[600px] flex items-center justify-center">
              <video controls className="w-full max-h-[600px]">
                <source src={`/api/files/${document.id}`} type={document.mimeType} />
                Your browser does not support video playback.
              </video>
            </div>
          )}
          {document.mimeType?.startsWith('image/') && (
            // eslint-disable-next-line @next/next/no-img-element
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-6 flex justify-center">
              <img
                src={`/api/files/${document.id}`}
                alt={document.title}
                className="max-w-full rounded-xl shadow-xs max-h-[650px] object-contain"
              />
            </div>
          )}
          {document.mimeType === 'application/pdf' && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xs mb-6">
              <iframe
                src={`/api/files/${document.id}`}
                className="w-full h-[75vh]"
                title={document.title}
              />
            </div>
          )}
          {!document.mimeType?.startsWith('audio/') &&
            !document.mimeType?.startsWith('video/') &&
            !document.mimeType?.startsWith('image/') &&
            document.mimeType !== 'application/pdf' && (
              <div className="py-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                  <HardDrive className="w-7 h-7" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {document.title}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Type: {document.mimeType || 'Binary file'} · Direct preview not available
                </p>
              </div>
            )}
          <div className="text-center pt-2">
            <a
              href={`/api/files/${document.id}?download=1`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl shadow-xs text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all cursor-pointer hover:shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Download File</span>
            </a>
          </div>
        </div>
      )}

      {/* Version History Section */}
      <div className="space-y-3 pt-6 border-t border-slate-200/80">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <span>Version Snapshots ({versionItems.length})</span>
        </h2>
        <VersionHistoryList versions={versionItems} showDocumentTitle={false} />
      </div>
    </div>
  );
}
