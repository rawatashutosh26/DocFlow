import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logAudit } from "@/lib/audit"; // <-- 1. Added the Audit Log import
import { documentAccessInclude, resolveDocumentAccess } from "@/lib/access";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // <-- 2. Updated params to a Promise
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    
    // <-- 3. Await the params before extracting the ID
    const resolvedParams = await params;
    const documentId = resolvedParams.id;

    // 1. Fetch the document and include sharing/folder permissions
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: documentAccessInclude,
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // 2. Check if it's already locked by someone else
    if (document.isLocked && document.lockedById !== userId) {
      return NextResponse.json({ error: "Document is currently locked by another user" }, { status: 423 }); // 423 Locked
    }

    // 3. Verify permissions (Must be Owner, project team member, or have EDITOR access)
    const access = resolveDocumentAccess(userId, document);

    if (!access.canEdit) {
      return NextResponse.json({ error: "You do not have permission to edit this document" }, { status: 403 });
    }

    // 4. Lock the document
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        isLocked: true,
        lockedById: userId
      }
    });

    // 5. Fire the Audit Log silently in the background
    await logAudit({
      action: "DOCUMENT_LOCKED",
      userId: userId,
      documentId: documentId,
      details: "Checked out / Locked the document",
    });

    return NextResponse.json({ 
      success: true, 
      message: "Document checked out successfully",
      document: updatedDocument 
    });

  } catch (error) {
    console.error("Lock Error:", error);
    return NextResponse.json({ error: "Failed to lock document" }, { status: 500 });
  }
}