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

    const currentUserId = (session.user as any).id;
    const resolvedParams = await params;
    const documentId = resolvedParams.id;
    
    const { email, accessLevel, canDownload } = await req.json();

    // 1. Verify the current user is the owner of the document
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document || document.ownerId !== currentUserId) {
      return NextResponse.json({ error: "Only the document owner can share it" }, { status: 403 });
    }

    // 2. Find the target user by email
    const targetUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User with this email not found" }, { status: 404 });
    }

    if (targetUser.id === currentUserId) {
      return NextResponse.json({ error: "You cannot share a document with yourself" }, { status: 400 });
    }

    // 3. Upsert the permission (Update if exists, Create if not). Editors
    // can always download (they need the file to edit it locally in some
    // flows); viewers only get download rights if explicitly checked.
    const resolvedCanDownload = accessLevel === "EDITOR" ? true : !!canDownload;
    const access = await prisma.documentAccess.upsert({
      where: {
        documentId_userId: {
          documentId: documentId,
          userId: targetUser.id
        }
      },
      update: { accessLevel: accessLevel, canDownload: resolvedCanDownload },
      create: {
        documentId: documentId,
        userId: targetUser.id,
        accessLevel: accessLevel,
        canDownload: resolvedCanDownload
      }
    });

    // 4. Log the audit event
    await logAudit({
      action: "DOCUMENT_SHARED",
      userId: currentUserId,
      documentId: documentId,
      details: `Shared with ${targetUser.email} as ${accessLevel}`,
    });

    return NextResponse.json({ success: true, access });

  } catch (error) {
    console.error("Share Error:", error);
    return NextResponse.json({ error: "Failed to share document" }, { status: 500 });
  }
}