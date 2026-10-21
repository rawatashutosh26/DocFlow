import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logAudit } from "@/lib/audit";
import { documentAccessInclude, resolveDocumentAccess } from "@/lib/access";

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
      include: documentAccessInclude,
    });

    if (!document || document.deletedAt) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const access = resolveDocumentAccess(userId, document);
    if (!access.hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const existing = await prisma.star.findUnique({
      where: { userId_documentId: { userId, documentId } },
    });

    let starred: boolean;
    if (existing) {
      await prisma.star.delete({ where: { id: existing.id } });
      starred = false;
    } else {
      await prisma.star.create({ data: { userId, documentId } });
      starred = true;
    }

    await logAudit({
      action: starred ? "DOCUMENT_STARRED" : "DOCUMENT_UNSTARRED",
      userId,
      documentId,
      details: `${starred ? "Starred" : "Unstarred"} "${document.title}"`,
    });

    return NextResponse.json({ success: true, starred });
  } catch (error) {
    console.error("Star Toggle Error:", error);
    return NextResponse.json({ error: "Failed to update star" }, { status: 500 });
  }
}