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

    const userId = (session.user as any).id;
    
    // Await the params before extracting the ID
    const resolvedParams = await params;
    const documentId = resolvedParams.id;

    // 1. Fetch the document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // 2. Verify permissions (Only the person who locked it, or the Owner, can unlock it)
    const isOwner = document.ownerId === userId;
    const isLocker = document.lockedById === userId;

    if (!isOwner && !isLocker) {
      return NextResponse.json({ error: "You do not have permission to unlock this document" }, { status: 403 });
    }

    // 3. Unlock the document
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        isLocked: false,
        lockedById: null
      }
    });

    // 4. Fire the Audit Log silently in the background
    await logAudit({
      action: "DOCUMENT_UNLOCKED",
      userId: userId,
      documentId: documentId,
      details: "Checked in / Unlocked the document",
    });

    return NextResponse.json({ 
      success: true, 
      message: "Document checked in successfully",
      document: updatedDocument 
    });

  } catch (error) {
    console.error("Unlock Error:", error);
    return NextResponse.json({ error: "Failed to unlock document" }, { status: 500 });
  }
}