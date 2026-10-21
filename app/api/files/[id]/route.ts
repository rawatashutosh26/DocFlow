import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logAudit } from "@/lib/audit";
import { readFile } from "fs/promises";
import path from "path";
import { documentAccessInclude, resolveDocumentAccess } from "@/lib/access";

const STORAGE_ROOT = path.join(process.cwd(), "local_storage");

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id: documentId } = await params;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: documentAccessInclude,
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.type !== "UPLOADED" || !document.filePath) {
      return NextResponse.json(
        { error: "This document has no downloadable file" },
        { status: 400 }
      );
    }

    const access = resolveDocumentAccess(userId, document);

    if (!access.hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Downloads (as opposed to inline viewing) require explicit permission
    // for anyone who isn't the owner.
    const url = new URL(req.url);
    const wantsDownload = url.searchParams.get("download") === "1";
    if (wantsDownload && !access.canDownload) {
      return NextResponse.json(
        { error: "You do not have permission to download this file" },
        { status: 403 }
      );
    }

    // filePath is stored as a filename relative to the local_storage root.
    // Guard against path traversal since it's used directly on disk.
    const safeName = path.basename(document.filePath);
    const absolutePath = path.join(STORAGE_ROOT, safeName);

    let fileBuffer: Buffer;
    try {
      fileBuffer = await readFile(absolutePath);
    } catch {
      return NextResponse.json(
        { error: "File is missing from storage" },
        { status: 404 }
      );
    }

    if (wantsDownload) {
      await logAudit({
        action: "DOCUMENT_DOWNLOADED",
        userId,
        documentId,
        details: `Downloaded ${document.title}`,
      });
    }

    const disposition = wantsDownload
      ? `attachment; filename="${encodeURIComponent(document.title)}"`
      : `inline; filename="${encodeURIComponent(document.title)}"`;

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": document.mimeType || "application/octet-stream",
        "Content-Disposition": disposition,
        "Content-Length": String(document.size ?? fileBuffer.length),
      },
    });
  } catch (error) {
    console.error("File serve error:", error);
    return NextResponse.json({ error: "Failed to retrieve file" }, { status: 500 });
  }
}
