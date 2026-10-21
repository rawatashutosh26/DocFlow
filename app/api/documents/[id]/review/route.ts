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
    const user = session.user as any;
    const userId = user.id;
    const { id: documentId } = await params;

    const { decision, comment } = await req.json();
    if (decision !== "APPROVED" && decision !== "REJECTED") {
      return NextResponse.json(
        { error: "decision must be APPROVED or REJECTED" },
        { status: 400 }
      );
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { sharedAccess: { where: { userId } } },
    });

    if (!document || document.deletedAt) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.status !== "PENDING") {
      return NextResponse.json(
        { error: "Document is not currently pending approval" },
        { status: 400 }
      );
    }

    const isOwner = document.ownerId === userId;
    const isReviewerViaShare = document.sharedAccess.length > 0;
    const isAdmin = user.role === "ADMIN";

    // A document's own owner can't approve/reject their own submission —
    // review has to come from someone it was shared with, or an admin.
    if (isOwner || (!isReviewerViaShare && !isAdmin)) {
      return NextResponse.json(
        { error: "You are not a reviewer for this document" },
        { status: 403 }
      );
    }

    const updated = await prisma.document.update({
      where: { id: documentId },
      data: { status: decision },
    });

    await logAudit({
      action: decision === "APPROVED" ? "DOCUMENT_APPROVED" : "DOCUMENT_REJECTED",
      userId,
      documentId,
      details: comment
        ? `${decision === "APPROVED" ? "Approved" : "Rejected"} "${document.title}": ${comment}`
        : `${decision === "APPROVED" ? "Approved" : "Rejected"} "${document.title}"`,
    });

    return NextResponse.json({ success: true, document: updated });
  } catch (error) {
    console.error("Review Error:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}