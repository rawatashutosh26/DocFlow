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
    const userId = (session.user as any).id;
    const { id: folderId } = await params;

    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (folder.ownerId !== userId) {
      return NextResponse.json(
        { error: "Only the project owner can lock or unlock it" },
        { status: 403 }
      );
    }

    const updated = await prisma.folder.update({
      where: { id: folderId },
      data: { isLocked: !folder.isLocked },
    });

    await logAudit({
      action: updated.isLocked ? "FOLDER_LOCKED" : "FOLDER_UNLOCKED",
      userId,
      details: `${updated.isLocked ? "Locked" : "Unlocked"} project "${folder.name}"`,
    });

    return NextResponse.json({ success: true, folder: updated });
  } catch (error) {
    console.error("Folder Lock Error:", error);
    return NextResponse.json({ error: "Failed to update project lock" }, { status: 500 });
  }
}