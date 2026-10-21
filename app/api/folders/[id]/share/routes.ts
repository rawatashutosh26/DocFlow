import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logAudit } from "@/lib/audit";

// Directly grants a user access to an entire project (and everything
// inside it), without requiring the project to be locked or the target
// user to send an access request first. Mirrors /api/documents/[id]/share
// but for folders.
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
    const { id: folderId } = await params;
    const { email, accessLevel } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }
    if (accessLevel !== "VIEWER" && accessLevel !== "EDITOR") {
      return NextResponse.json({ error: "accessLevel must be VIEWER or EDITOR" }, { status: 400 });
    }

    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (folder.ownerId !== userId) {
      return NextResponse.json(
        { error: "Only the project owner can share it" },
        { status: 403 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!targetUser) {
      return NextResponse.json({ error: "No user found with that email" }, { status: 404 });
    }
    if (targetUser.id === userId) {
      return NextResponse.json({ error: "You cannot share a project with yourself" }, { status: 400 });
    }

    const access = await prisma.folderAccess.upsert({
      where: { folderId_userId: { folderId, userId: targetUser.id } },
      update: { accessLevel },
      create: { folderId, userId: targetUser.id, accessLevel },
    });

    await logAudit({
      action: "FOLDER_SHARED",
      userId,
      details: `Shared project "${folder.name}" with ${targetUser.email} as ${accessLevel}`,
    });

    return NextResponse.json({ success: true, access });
  } catch (error) {
    console.error("Folder Share Error:", error);
    return NextResponse.json({ error: "Failed to share project" }, { status: 500 });
  }
}

// Revoke a previously-granted direct share.
export async function DELETE(
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
    const { id: folderId } = await params;
    const url = new URL(req.url);
    const targetUserId = url.searchParams.get("userId");

    if (!targetUserId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (folder.ownerId !== userId) {
      return NextResponse.json(
        { error: "Only the project owner can manage its access" },
        { status: 403 }
      );
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });

    await prisma.folderAccess.deleteMany({ where: { folderId, userId: targetUserId } });

    await logAudit({
      action: "FOLDER_ACCESS_REVOKED",
      userId,
      details: `Removed ${targetUser?.email || "a user"}'s access to project "${folder.name}"`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Folder Unshare Error:", error);
    return NextResponse.json({ error: "Failed to update project access" }, { status: 500 });
  }
}
