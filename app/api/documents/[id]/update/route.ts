import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { writeFile } from 'fs/promises';
import path from 'path';
import { logAudit } from "@/lib/audit";

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

    // 1. Fetch the document
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document || document.deletedAt) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // 2. Security Check: The file MUST be locked, and locked by THIS user
    if (!document.isLocked || document.lockedById !== userId) {
      return NextResponse.json({ 
        error: "You must check out (lock) this document before uploading a new version" 
      }, { status: 403 });
    }

    // 3. Extract the new file from the request
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 4. Save the new file to the local filesystem. Same storage location and
    // filename convention as the initial upload route (./local_storage,
    // filename-only reference in the DB) so both routes stay compatible with
    // /api/files/[id].
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const filePath = path.join(process.cwd(), "local_storage", fileName);
    await writeFile(filePath, buffer);

    // 5. Snapshot the CURRENT (about to be replaced) file as a version, then
    // update the database: bump version, unlock, and — if this document had
    // been rejected — restart the approval workflow rather than leaving it
    // silently rejected once someone's addressed the feedback.
    await prisma.documentVersion.create({
      data: {
        documentId,
        version: document.version,
        filePath: document.filePath,
        size: document.size,
        mimeType: document.mimeType,
        createdById: userId,
      },
    });

    const nextStatus = document.status === "REJECTED" ? "PENDING" : document.status;

    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        size: file.size,
        mimeType: file.type,
        filePath: fileName,
        version: { increment: 1 },
        isLocked: false,
        lockedById: null,
        status: nextStatus,
      }
    });

    // 6. Log the new version to the audit trail
    await logAudit({
      action: "DOCUMENT_VERSION_UPLOADED",
      userId,
      documentId,
      details: `Uploaded version ${updatedDocument.version} of ${updatedDocument.title}`,
    });

    if (document.status === "REJECTED") {
      await logAudit({
        action: "DOCUMENT_SUBMITTED_FOR_APPROVAL",
        userId,
        documentId,
        details: `New version of previously-rejected "${document.title}" restarted the approval workflow`,
      });
    }

    return NextResponse.json({
      success: true,
      message: "New version uploaded successfully",
      document: updatedDocument
    });

  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: "Failed to upload new version" }, { status: 500 });
  }
}