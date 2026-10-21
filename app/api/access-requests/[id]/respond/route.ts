import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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
    const { id: requestId } = await params;
    const { decision } = await req.json();

    if (decision !== "APPROVED" && decision !== "DENIED") {
      return NextResponse.json(
        { error: "decision must be APPROVED or DENIED" },
        { status: 400 }
      );
    }

    const accessRequest = await prisma.accessRequest.findUnique({
      where: { id: requestId },
      include: { document: true, folder: true },
    });

    if (!accessRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    if (accessRequest.ownerId !== userId) {
      return NextResponse.json(
        { error: "Only the owner can respond to this request" },
        { status: 403 }
      );
    }
    if (accessRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "This request has already been resolved" },
        { status: 400 }
      );
    }

    if (decision === "APPROVED") {
      if (accessRequest.documentId) {
        await prisma.documentAccess.upsert({
          where: {
            documentId_userId: {
              documentId: accessRequest.documentId,
              userId: accessRequest.requesterId,
            },
          },
          update: { accessLevel: accessRequest.requestedLevel },
          create: {
            documentId: accessRequest.documentId,
            userId: accessRequest.requesterId,
            accessLevel: accessRequest.requestedLevel,
          },
        });
      } else if (accessRequest.folderId) {
        await prisma.folderAccess.upsert({
          where: {
            folderId_userId: {
              folderId: accessRequest.folderId,
              userId: accessRequest.requesterId,
            },
          },
          update: { accessLevel: accessRequest.requestedLevel },
          create: {
            folderId: accessRequest.folderId,
            userId: accessRequest.requesterId,
            accessLevel: accessRequest.requestedLevel,
          },
        });
      }
    }

    const updated = await prisma.accessRequest.update({
      where: { id: requestId },
      data: { status: decision, resolvedAt: new Date() },
    });

    const resourceName = accessRequest.document?.title || accessRequest.folder?.name || "item";

    await logAudit({
      action: decision === "APPROVED" ? "ACCESS_REQUEST_APPROVED" : "ACCESS_REQUEST_DENIED",
      userId,
      documentId: accessRequest.documentId || undefined,
      details: `${decision === "APPROVED" ? "Approved" : "Denied"} access request for "${resourceName}"`,
    });

    return NextResponse.json({ success: true, accessRequest: updated });
  } catch (error) {
    console.error("Access Request Respond Error:", error);
    return NextResponse.json({ error: "Failed to respond to request" }, { status: 500 });
  }
}