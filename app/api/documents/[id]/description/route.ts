import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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
    const { description } = await req.json();

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
        { error: "You do not have permission to edit this document" },
        { status: 403 }
      );
    }

    const updated = await prisma.document.update({
      where: { id: documentId },
      data: { description: (description ?? "").trim() || null },
    });

    return NextResponse.json({ success: true, document: updated });
  } catch (error) {
    console.error("Description Update Error:", error);
    return NextResponse.json({ error: "Failed to update description" }, { status: 500 });
  }
}