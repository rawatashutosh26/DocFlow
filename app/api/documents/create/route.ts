import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logAudit } from "@/lib/audit"; // <-- 1. Import the utility
import { getFolderAccess } from "@/lib/access";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;
    const body = await req.json();
    const { title, folderId, description } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (folderId) {
      const { folder, access } = await getFolderAccess(userId, folderId);
      if (!folder || !access.canEdit) {
        return NextResponse.json({ error: "Folder not found" }, { status: 404 });
      }
    }

    const document = await prisma.document.create({
      data: {
        title: title,
        description: description?.trim() || null,
        type: "NATIVE",
        content: "",
        size: 0,
        mimeType: "text/html",
        ownerId: userId,
        folderId: folderId || null,
      }
    });

    // 2. Fire the audit log silently in the background
    await logAudit({
      action: "DOCUMENT_CREATED",
      userId: userId,
      documentId: document.id,
      details: `Created new document: ${title}`,
    });

    return NextResponse.json({ success: true, document });

  } catch (error) {
    console.error("Create Document Error:", error);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}