import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logAudit } from "@/lib/audit";

async function requireLead(teamId: string, userId: string) {
  const membership = await prisma.teamMembership.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
  return membership?.role === "LEAD";
}

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
    const { id: teamId } = await params;
    const { email } = await req.json();

    if (!(await requireLead(teamId, userId))) {
      return NextResponse.json(
        { error: "Only team leads can add members" },
        { status: 403 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: (email || "").toLowerCase().trim() },
    });
    if (!targetUser) {
      return NextResponse.json({ error: "No user found with that email" }, { status: 404 });
    }

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    await prisma.teamMembership.upsert({
      where: { teamId_userId: { teamId, userId: targetUser.id } },
      update: {},
      create: { teamId, userId: targetUser.id, role: "MEMBER" },
    });

    await logAudit({
      action: "TEAM_MEMBER_ADDED",
      userId,
      details: `Added ${targetUser.email} to team "${team.name}"`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Team Add Member Error:", error);
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
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
    const { id: teamId } = await params;
    const url = new URL(req.url);
    const targetUserId = url.searchParams.get("userId");

    if (!targetUserId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    if (!(await requireLead(teamId, userId))) {
      return NextResponse.json(
        { error: "Only team leads can remove members" },
        { status: 403 }
      );
    }

    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    await prisma.teamMembership.deleteMany({
      where: { teamId, userId: targetUserId },
    });

    await logAudit({
      action: "TEAM_MEMBER_REMOVED",
      userId,
      details: `Removed a member from team "${team.name}"`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Team Remove Member Error:", error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}