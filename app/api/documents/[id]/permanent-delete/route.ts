import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logAudit } from "@/lib/audit";
import { unlink } from "fs/promises";
import path from "path";

const STORAGE_ROOT = path.join(process.cwd(), "local_storage");

async function safeUnlink(fileName: string | null) {
  if (!fileName) return;
  try {
    await unlink(path.join(STORAGE_ROOT, path.basename(fileName)));
  } catch {
    // Already missing from disk — fine, we're deleting anyway.
  }
}

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
      include: { versions: true },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    if (document.ownerId !== userId) {
      return NextResponse.json(
        { error: "Only the document owner can permanently delete it" },
        { status: 403 }
      );
    }
    if (!document.deletedAt) {
      return NextResponse.json(
        { error: "Move the document to Trash before deleting it permanently" },
        { status: 400 }
      );
    }

    // Clean up every file on disk this document ever touched.
    await safeUnlink(document.filePath);
    for (const version of document.versions) {
      await safeUnlink(version.filePath);
    }

    // DocumentVersion rows cascade-delete automatically (onDelete: Cascade).
    await prisma.document.delete({ where: { id: documentId } });

    await logAudit({
      action: "DOCUMENT_PERMANENTLY_DELETED",
      userId,
      details: `Permanently deleted "${document.title}"`,
    });

    return NextResponse.json({ success: true, message: "Document permanently deleted" });
  } catch (error) {
    console.error("Permanent Delete Error:", error);
    return NextResponse.json({ error: "Failed to permanently delete document" }, { status: 500 });
  }
}