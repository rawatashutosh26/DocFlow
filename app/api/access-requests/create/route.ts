import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;
    const { documentId, folderId, requestedLevel, message } = await req.json();

    if (!documentId && !folderId) {
      return NextResponse.json(
        { error: "documentId or folderId is required" },
        { status: 400 }
      );
    }
    if (documentId && folderId) {
      return NextResponse.json(
        { error: "Provide only one of documentId or folderId" },
        { status: 400 }
      );
    }
    if (requestedLevel !== "VIEWER" && requestedLevel !== "EDITOR") {
      return NextResponse.json(
        { error: "requestedLevel must be VIEWER or EDITOR" },
        { status: 400 }
      );
    }

    let ownerId: string;
    let resourceName: string;

    if (documentId) {
      const document = await prisma.document.findUnique({ where: { id: documentId } });
      if (!document || document.deletedAt) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
      }
      if (document.ownerId === userId) {
        return NextResponse.json({ error: "You already own this document" }, { status: 400 });
      }
      ownerId = document.ownerId;
      resourceName = document.title;
    } else {
      const folder = await prisma.folder.findUnique({ where: { id: folderId } });
      if (!folder) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
      if (folder.ownerId === userId) {
        return NextResponse.json({ error: "You already own this project" }, { status: 400 });
      }
      ownerId = folder.ownerId;
      resourceName = folder.name;
    }

    // Don't allow duplicate pending requests for the same resource.
    const existing = await prisma.accessRequest.findFirst({
      where: {
        requesterId: userId,
        status: "PENDING",
        ...(documentId ? { documentId } : { folderId }),
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You already have a pending request for this item" },
        { status: 400 }
      );
    }

    const accessRequest = await prisma.accessRequest.create({
      data: {
        requesterId: userId,
        ownerId,
        documentId: documentId || null,
        folderId: folderId || null,
        requestedLevel,
        message: message?.trim() || null,
      },
    });

    await logAudit({
      action: "ACCESS_REQUESTED",
      userId,
      documentId: documentId || undefined,
      details: `Requested ${requestedLevel.toLowerCase()} access to "${resourceName}"`,
    });

    return NextResponse.json({ success: true, accessRequest });
  } catch (error) {
    console.error("Access Request Create Error:", error);
    return NextResponse.json({ error: "Failed to create access request" }, { status: 500 });
  }
}