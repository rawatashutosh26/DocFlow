import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logAudit } from "@/lib/audit";

// Restores a document out of the Trash (undoes a soft-delete). Distinct
// from /api/documents/[id]/versions/[versionId]/restore, which restores an
// old *version's content* of a still-active document.
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

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (!document.deletedAt) {
      return NextResponse.json({ error: "Document is not in Trash" }, { status: 400 });
    }

    // Only the owner can restore a trashed document — matches who's allowed
    // to delete/permanently-delete it in the first place.
    if (document.ownerId !== userId) {
      return NextResponse.json(
        { error: "You do not have permission to restore this document" },
        { status: 403 }
      );
    }

    const updated = await prisma.document.update({
      where: { id: documentId },
      data: { deletedAt: null },
    });

    await logAudit({
      action: "DOCUMENT_RESTORED",
      userId,
      documentId,
      details: `Restored "${document.title}" from Trash`,
    });

    return NextResponse.json({ success: true, document: updated });
  } catch (error) {
    console.error("Restore Error:", error);
    return NextResponse.json({ error: "Failed to restore document" }, { status: 500 });
  }
}
