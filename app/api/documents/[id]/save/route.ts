import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logAudit } from "@/lib/audit";
import { documentAccessInclude, resolveDocumentAccess } from "@/lib/access";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;

    const resolvedParams = await params;
    const documentId = resolvedParams.id;

    const { content } = await req.json();
    const url = new URL(req.url);
    // The editor's autosave (debounced, every 2s of typing) omits this flag;
    // only an explicit "Save Now" click sends it. Version snapshots are only
    // taken on explicit saves, otherwise every keystroke pause would create
    // a version — not useful history.
    const isExplicitSave = url.searchParams.get("explicit") === "1";

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: documentAccessInclude,
    });

    if (!document || document.deletedAt) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const access = resolveDocumentAccess(userId, document);

    if (!access.canEdit) {
      return NextResponse.json({ error: "You do not have permission to edit this document" }, { status: 403 });
    }

    // Rejection handling: editing a rejected document and saving it restarts
    // the approval workflow (moves it back to PENDING) rather than leaving
    // it silently rejected forever.
    const nextStatus = document.status === "REJECTED" ? "PENDING" : document.status;

    if (isExplicitSave) {
      await prisma.documentVersion.create({
        data: {
          documentId,
          version: document.version,
          content: document.content,
          createdById: userId,
        },
      });
    }

    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        content: content,
        status: nextStatus,
        ...(isExplicitSave ? { version: { increment: 1 } } : {}),
      }
    });

    await logAudit({
      action: "DOCUMENT_EDITED",
      userId: userId,
      documentId: documentId,
      details: isExplicitSave ? "Saved document (new version checkpoint)" : "Auto-saved document changes",
    });

    if (document.status === "REJECTED") {
      await logAudit({
        action: "DOCUMENT_SUBMITTED_FOR_APPROVAL",
        userId,
        documentId,
        details: `Edits to previously-rejected "${document.title}" restarted the approval workflow`,
      });
    }

    return NextResponse.json({ success: true, document: updatedDocument });

  } catch (error) {
    console.error("Save Error:", error);
    return NextResponse.json({ error: "Failed to save document" }, { status: 500 });
  }
}