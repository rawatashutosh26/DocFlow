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
    const { teamId } = await req.json(); // teamId can be null to unassign

    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (folder.ownerId !== userId) {
      return NextResponse.json(
        { error: "Only the project owner can assign it to a team" },
        { status: 403 }
      );
    }

    let teamName: string | null = null;
    if (teamId) {
      const membership = await prisma.teamMembership.findUnique({
        where: { teamId_userId: { teamId, userId } },
        include: { team: true },
      });
      if (!membership) {
        return NextResponse.json(
          { error: "You must be a member of the team to assign a project to it" },
          { status: 403 }
        );
      }
      teamName = membership.team.name;
    }

    const updated = await prisma.folder.update({
      where: { id: folderId },
      data: { teamId: teamId || null },
    });

    await logAudit({
      action: "FOLDER_TEAM_ASSIGNED",
      userId,
      details: teamId
        ? `Assigned project "${folder.name}" to team "${teamName}"`
        : `Removed project "${folder.name}" from its team`,
    });

    return NextResponse.json({ success: true, folder: updated });
  } catch (error) {
    console.error("Folder Team Assign Error:", error);
    return NextResponse.json({ error: "Failed to assign team" }, { status: 500 });
  }
}