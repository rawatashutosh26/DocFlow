import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logAudit } from "@/lib/audit";
import { documentAccessInclude, resolveDocumentAccess } from "@/lib/access";

// Submitting for approval now ALWAYS targets one specific, named reviewer:
// this grants them DocumentAccess at the chosen level (VIEWER/EDITOR) AND
// moves the document to PENDING in one step, so review is never open to
// "anyone with a link" — only the person the author explicitly names.
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

    const { reviewerEmail, accessLevel } = await req.json();

    if (!reviewerEmail || typeof reviewerEmail !== "string") {
      return NextResponse.json(
        { error: "reviewerEmail is required" },
        { status: 400 }
      );
    }
    if (accessLevel !== "VIEWER" && accessLevel !== "EDITOR") {
      return NextResponse.json(
        { error: "accessLevel must be VIEWER or EDITOR" },
        { status: 400 }
      );
    }

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
        { error: "You do not have permission to submit this document" },
        { status: 403 }
      );
    }

    if (document.status === "PENDING") {
      return NextResponse.json({ error: "Document is already pending approval" }, { status: 400 });
    }
    if (document.status === "APPROVED") {
      return NextResponse.json({ error: "Document is already approved" }, { status: 400 });
    }

    const reviewer = await prisma.user.findUnique({
      where: { email: reviewerEmail.toLowerCase().trim() },
    });
    if (!reviewer) {
      return NextResponse.json(
        { error: "No user found with that email" },
        { status: 404 }
      );
    }
    if (reviewer.id === document.ownerId) {
      return NextResponse.json(
        { error: "You can't submit a document to its own owner for review" },
        { status: 400 }
      );
    }

    // Grant the reviewer access at the chosen level and flip to PENDING,
    // in a single transaction so the two never end up out of sync.
    const [, updated] = await prisma.$transaction([
      prisma.documentAccess.upsert({
        where: {
          documentId_userId: { documentId, userId: reviewer.id },
        },
        update: { accessLevel },
        create: { documentId, userId: reviewer.id, accessLevel },
      }),
      prisma.document.update({
        where: { id: documentId },
        data: { status: "PENDING" },
      }),
    ]);

    await logAudit({
      action: "DOCUMENT_SUBMITTED_FOR_APPROVAL",
      userId,
      documentId,
      details: `Submitted "${document.title}" to ${reviewer.email} for approval (${accessLevel.toLowerCase()} access)`,
    });

    return NextResponse.json({ success: true, document: updated });
  } catch (error) {
    console.error("Submit Error:", error);
    return NextResponse.json({ error: "Failed to submit document" }, { status: 500 });
  }
}