import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    // 1. Validate the user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const ownerId = (session.user as any).id;
    const body = await req.json();
    const { documentId, targetEmail, accessLevel, canDownload } = body;

    if (!documentId || !targetEmail || !accessLevel) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 2. Verify the logged-in user actually owns this document
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.ownerId !== ownerId) {
      return NextResponse.json({ error: "You do not have permission to share this document" }, { status: 403 });
    }

    // 3. Find the user we want to share with via their email
    const targetUser = await prisma.user.findUnique({
      where: { email: targetEmail }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "No user found with that email address" }, { status: 404 });
    }

    if (targetUser.id === ownerId) {
      return NextResponse.json({ error: "You cannot share a document with yourself" }, { status: 400 });
    }

    // 4. Create or Update the DocumentAccess record (RBAC)
    // Using upsert ensures we don't create duplicate permission rules
    const sharedAccess = await prisma.documentAccess.upsert({
      where: {
        documentId_userId: {
          documentId: documentId,
          userId: targetUser.id
        }
      },
      update: {
        accessLevel: accessLevel,
        canDownload: canDownload
      },
      create: {
        documentId: documentId,
        userId: targetUser.id,
        accessLevel: accessLevel,
        canDownload: canDownload
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Document shared with ${targetUser.email}`,
      sharedAccess 
    });

  } catch (error) {
    console.error("Share Error:", error);
    return NextResponse.json({ error: "Failed to share document" }, { status: 500 });
  }
}