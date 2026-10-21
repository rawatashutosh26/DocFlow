import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logAudit } from "@/lib/audit";
import { documentAccessInclude, resolveDocumentAccess } from "@/lib/access";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;
    const { id: documentId, versionId } = await params;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: documentAccessInclude,
    });

    if (!document || document.deletedAt) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const access = resolveDocumentAccess(userId, document);
    if (!access.canEdit) {
      return NextResponse.json(
        { error: "You do not have permission to restore versions of this document" },
        { status: 403 }
      );
    }

    if (document.isLocked && document.lockedById !== userId) {
      return NextResponse.json(
        { error: "Document is checked out by someone else" },
        { status: 423 }
      );
    }

    const versionToRestore = await prisma.documentVersion.findUnique({
      where: { id: versionId },
    });

    if (!versionToRestore || versionToRestore.documentId !== documentId) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Snapshot the CURRENT state before overwriting it, so restoring an old
    // version never destroys the version you were just on.
    await prisma.documentVersion.create({
      data: {
        documentId,
        version: document.version,
        filePath: document.filePath,
        content: document.content,
        size: document.size,
        mimeType: document.mimeType,
        createdById: userId,
      },
    });

    const updated = await prisma.document.update({
      where: { id: documentId },
      data: {
        filePath: versionToRestore.filePath ?? document.filePath,
        content: versionToRestore.content ?? document.content,
        size: versionToRestore.size ?? document.size,
        mimeType: versionToRestore.mimeType ?? document.mimeType,
        version: { increment: 1 },
      },
    });

    await logAudit({
      action: "DOCUMENT_VERSION_RESTORED",
      userId,
      documentId,
      details: `Restored "${document.title}" to version ${versionToRestore.version}`,
    });

    return NextResponse.json({ success: true, document: updated });
  } catch (error) {
    console.error("Version Restore Error:", error);
    return NextResponse.json({ error: "Failed to restore version" }, { status: 500 });
  }
}