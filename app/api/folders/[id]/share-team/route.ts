import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logAudit } from "@/lib/audit";

// Shares a project with an entire team (every member gets `accessLevel`
// access to the project and its files) WITHOUT making that team the
// project's owner. This is distinct from /api/folders/[id]/assign-team,
// which transfers ownership to a single team.
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
    const { teamId, accessLevel } = await req.json();

    if (!teamId) {
      return NextResponse.json({ error: "teamId is required" }, { status: 400 });
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

    if (folder.teamId === teamId) {
      return NextResponse.json(
        { error: "This team already owns the project" },
        { status: 400 }
      );
    }

    // The owner must belong to the team they're sharing with, same rule as
    // assigning ownership — prevents granting access to teams at random.
    const membership = await prisma.teamMembership.findUnique({
      where: { teamId_userId: { teamId, userId } },
      include: { team: true },
    });
    if (!membership) {
      return NextResponse.json(
        { error: "You must be a member of the team to share a project with it" },
        { status: 403 }
      );
    }

    const share = await prisma.folderTeamAccess.upsert({
      where: { folderId_teamId: { folderId, teamId } },
      update: { accessLevel },
      create: { folderId, teamId, accessLevel },
    });

    await logAudit({
      action: "FOLDER_TEAM_SHARED",
      userId,
      details: `Shared project "${folder.name}" with team "${membership.team.name}" as ${accessLevel}`,
    });

    return NextResponse.json({ success: true, share });
  } catch (error) {
    console.error("Folder Team Share Error:", error);
    return NextResponse.json({ error: "Failed to share project with team" }, { status: 500 });
  }
}

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
    const teamId = url.searchParams.get("teamId");

    if (!teamId) {
      return NextResponse.json({ error: "teamId is required" }, { status: 400 });
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

    const team = await prisma.team.findUnique({ where: { id: teamId } });

    await prisma.folderTeamAccess.deleteMany({ where: { folderId, teamId } });

    await logAudit({
      action: "FOLDER_TEAM_SHARE_REMOVED",
      userId,
      details: `Removed team "${team?.name || "unknown"}"'s access to project "${folder.name}"`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Folder Team Unshare Error:", error);
    return NextResponse.json({ error: "Failed to update project access" }, { status: 500 });
  }
}
