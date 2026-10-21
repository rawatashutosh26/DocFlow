import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logAudit } from "@/lib/audit";
import { getFolderAccess } from "@/lib/access";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;
    const { name, parentId } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
    }

    // If a parent is specified, make sure it exists and the user has at
    // least editor access to it (owner, project team member, or someone
    // it's been explicitly shared with as an editor).
    if (parentId) {
      const { folder: parent, access } = await getFolderAccess(userId, parentId);
      if (!parent || !access.canEdit) {
        return NextResponse.json({ error: "Parent folder not found" }, { status: 404 });
      }
    }

    const folder = await prisma.folder.create({
      data: {
        name: name.trim(),
        parentId: parentId || null,
        ownerId: userId,
        // Subfolders don't automatically inherit their parent's sharing —
        // access is resolved per-folder. Carrying the parent's owning team
        // forward keeps a shared project's whole tree usable by that team
        // without requiring it to be re-shared one subfolder at a time.
        teamId: parentId
          ? (await prisma.folder.findUnique({ where: { id: parentId }, select: { teamId: true } }))?.teamId ?? null
          : null,
      },
    });

    await logAudit({
      action: "FOLDER_CREATED",
      userId,
      details: `Created folder: ${folder.name}`,
    });

    return NextResponse.json({ success: true, folder });
  } catch (error) {
    console.error("Folder Create Error:", error);
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
}

