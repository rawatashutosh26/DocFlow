import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logAudit } from "@/lib/audit";

// NOTE: This is now a SOFT delete — it moves the document to Trash rather
// than destroying it. See /api/documents/[id]/permanent-delete for the
// irreversible version, and /api/documents/[id]/restore to undo this.
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
    const { id: documentId } = await params;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document || document.deletedAt) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Only the owner can delete. (Shared editors can edit, not destroy.)
    if (document.ownerId !== userId) {
      return NextResponse.json(
        { error: "Only the document owner can delete it" },
        { status: 403 }
      );
    }

    if (document.isLocked) {
      return NextResponse.json(
        { error: "Check in the document before deleting it" },
        { status: 423 }
      );
    }

    await prisma.document.update({
      where: { id: documentId },
      data: { deletedAt: new Date() },
    });

    await logAudit({
      action: "DOCUMENT_DELETED",
      userId,
      documentId,
      details: `Moved "${document.title}" to Trash`,
    });

    return NextResponse.json({ success: true, message: "Document moved to Trash" });
  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}