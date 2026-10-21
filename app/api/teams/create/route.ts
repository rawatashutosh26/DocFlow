import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;
    const { name, description } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Team name is required" }, { status: 400 });
    }

    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        members: {
          create: { userId, role: "LEAD" },
        },
      },
    });

    await logAudit({
      action: "TEAM_CREATED",
      userId,
      details: `Created team "${team.name}"`,
    });

    return NextResponse.json({ success: true, team });
  } catch (error) {
    console.error("Team Create Error:", error);
    return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
  }
}